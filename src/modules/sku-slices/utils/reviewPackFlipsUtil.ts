import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { Sku } from "../../skus/models/Sku.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  decidePackFlipPatchesForSeries,
  readPackFlipPoint,
  type PackFlipSeriesDecision,
  type SeriesDay,
  type SlicePoint,
} from "../../slices/utils/detectPackFlipSpike.js";
import type { ISkuSliceDataItem } from "../models/skuSliceTypes.js";
import {
  loadDayMapsForKonkDates,
  upsertDayPoint,
} from "./skuSliceMonthStore.js";

export type PackFlipFinding = {
  productId: string;
  skuId: string;
  title: string;
  url: string;
  imageUrl: string;
  kind: "inverse" | "price-only" | "ambiguous";
  date: string;
  neighborDate: string;
  factor: number;
  from: SlicePoint;
  patched?: SlicePoint;
};

export type PackFlipReviewResult = {
  konkName: string;
  apply: boolean;
  dates: string[];
  patched: PackFlipFinding[];
  priceOnly: PackFlipFinding[];
  ambiguous: PackFlipFinding[];
};

export type ReviewPackFlipsInput = {
  dates: Date[];
  apply: boolean;
  konkName: string;
};

type SkuMeta = { skuId: string; title: string; url: string; imageUrl: string };

export function addUtcDays(date: Date, delta: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + delta,
    ),
  );
}

export function toUtcYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultPackFlipReviewDates(now = new Date()): Date[] {
  const to = toSliceDate(now);
  return enumerateReportingDates(addUtcDays(to, -6), to);
}

export function packFlipReviewDatesForSliceDay(sliceDate: Date): Date[] {
  const today = addUtcDays(sliceDate, 0);
  return [addUtcDays(today, -2), addUtcDays(today, -1), today];
}

function emptyResult(
  konkName: string,
  apply: boolean,
  dates: Date[],
): PackFlipReviewResult {
  return {
    konkName,
    apply,
    dates: dates.map(toUtcYmd),
    patched: [],
    priceOnly: [],
    ambiguous: [],
  };
}

function collectProductIds(
  dataByDate: Map<number, Record<string, unknown>>,
): string[] {
  const ids = new Set<string>();
  for (const data of dataByDate.values()) {
    for (const key of Object.keys(data)) {
      ids.add(key);
    }
  }
  return [...ids];
}

function toFinding(
  productId: string,
  meta: SkuMeta | undefined,
  dates: Date[],
  decision: PackFlipSeriesDecision,
): PackFlipFinding {
  const date = dates[decision.index];
  const neighbor = dates[decision.neighborIndex];
  return {
    productId,
    skuId: meta?.skuId ?? "",
    title: meta?.title ?? "",
    url: meta?.url ?? "",
    imageUrl: meta?.imageUrl ?? "",
    kind: decision.kind,
    date: date ? toUtcYmd(date) : "",
    neighborDate: neighbor ? toUtcYmd(neighbor) : "",
    factor: decision.factor,
    from: decision.from,
    ...(decision.patched ? { patched: decision.patched } : {}),
  };
}

async function loadSkuMetaByProductId(
  konkName: string,
): Promise<Map<string, SkuMeta>> {
  const rows = await Sku.find({ konkName })
    .select("_id productId title url imageUrl")
    .lean<{
      _id?: { toString(): string };
      productId?: string;
      title?: string;
      url?: string;
      imageUrl?: string;
    }[]>();
  const map = new Map<string, SkuMeta>();
  for (const row of rows) {
    if (typeof row.productId !== "string" || !row.productId) continue;
    map.set(row.productId, {
      skuId: row._id ? row._id.toString() : "",
      title: typeof row.title === "string" ? row.title : "",
      url: typeof row.url === "string" ? row.url : "",
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : "",
    });
  }
  return map;
}

async function applyInversePatches(
  konkName: string,
  findings: PackFlipFinding[],
): Promise<void> {
  for (const finding of findings) {
    if (!finding.patched || !finding.date) continue;
    const item: ISkuSliceDataItem = finding.patched;
    await upsertDayPoint(
      konkName,
      finding.productId,
      new Date(`${finding.date}T00:00:00.000Z`),
      item,
    );
  }
}

function buildFindings(
  dates: Date[],
  dataByDate: Map<number, Record<string, unknown>>,
  skuMeta: Map<string, SkuMeta>,
): PackFlipFinding[] {
  const findings: PackFlipFinding[] = [];
  for (const productId of collectProductIds(dataByDate)) {
    const series: SeriesDay[] = dates.map((date) => ({
      dateMs: date.getTime(),
      point: readPackFlipPoint(dataByDate.get(date.getTime())?.[productId]),
    }));
    const decisions = decidePackFlipPatchesForSeries(series);
    for (const decision of decisions) {
      findings.push(
        toFinding(productId, skuMeta.get(productId), dates, decision),
      );
    }
  }
  return findings;
}

export async function reviewPackFlipsUtil(
  input: ReviewPackFlipsInput,
): Promise<PackFlipReviewResult> {
  const konkName = input.konkName;
  const dates = [...input.dates]
    .map((d) => addUtcDays(d, 0))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return emptyResult(konkName, input.apply, dates);
  }

  const maps = await loadDayMapsForKonkDates(konkName, dates);
  const dataByDate = new Map<number, Record<string, unknown>>();
  for (const date of dates) {
    dataByDate.set(date.getTime(), maps.get(date.getTime()) ?? {});
  }

  const skuMeta = await loadSkuMetaByProductId(konkName);
  const findings = buildFindings(dates, dataByDate, skuMeta);

  const patched = findings.filter((f) => f.kind === "inverse");
  const priceOnly = findings.filter((f) => f.kind === "price-only");
  const ambiguous = findings.filter((f) => f.kind === "ambiguous");

  if (input.apply && patched.length > 0) {
    await applyInversePatches(konkName, patched);
    const byDay = new Map<string, Set<string>>();
    for (const finding of patched) {
      if (!finding.date) continue;
      const set = byDay.get(finding.date) ?? new Set<string>();
      set.add(finding.productId);
      byDay.set(finding.date, set);
    }
    for (const [ymd, productIds] of byDay) {
      await afterSkuSliceStockMutation({
        konkName,
        dayD: new Date(`${ymd}T00:00:00.000Z`),
        productIds: [...productIds],
      });
    }
  }

  return {
    konkName,
    apply: input.apply,
    dates: dates.map(toUtcYmd),
    patched,
    priceOnly,
    ambiguous,
  };
}
