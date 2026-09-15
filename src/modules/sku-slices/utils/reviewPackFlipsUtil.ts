import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { Sku } from "../../skus/models/Sku.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  decidePackFlipPatchesForSeries,
  readPackFlipPoint,
  type PackFlipSeriesDecision,
  type SeriesDay,
  type SlicePoint,
} from "../../slices/utils/detectPackFlipSpike.js";
import {
  SkuSlice,
  type ISkuSliceDataItem,
} from "../models/SkuSlice.js";

export type PackFlipFinding = {
  productId: string;
  title: string;
  url: string;
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

type LeanSlice = {
  _id: unknown;
  date: Date;
  data?: Record<string, unknown>;
};

type SkuMeta = { title: string; url: string };

export function addUtcDays(date: Date, delta: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + delta)
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
  dates: Date[]
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
  dataByDate: Map<number, Record<string, unknown>>
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
  decision: PackFlipSeriesDecision
): PackFlipFinding {
  const date = dates[decision.index];
  const neighbor = dates[decision.neighborIndex];
  return {
    productId,
    title: meta?.title ?? "",
    url: meta?.url ?? "",
    kind: decision.kind,
    date: date ? toUtcYmd(date) : "",
    neighborDate: neighbor ? toUtcYmd(neighbor) : "",
    factor: decision.factor,
    from: decision.from,
    ...(decision.patched ? { patched: decision.patched } : {}),
  };
}

async function loadSkuMetaByProductId(
  konkName: string
): Promise<Map<string, SkuMeta>> {
  const rows = await Sku.find({ konkName })
    .select("productId title url")
    .lean<{ productId?: string; title?: string; url?: string }[]>();
  const map = new Map<string, SkuMeta>();
  for (const row of rows) {
    if (typeof row.productId !== "string" || !row.productId) continue;
    map.set(row.productId, {
      title: typeof row.title === "string" ? row.title : "",
      url: typeof row.url === "string" ? row.url : "",
    });
  }
  return map;
}

async function applyInversePatches(
  slices: LeanSlice[],
  findings: PackFlipFinding[]
): Promise<void> {
  const byDate = new Map<string, PackFlipFinding[]>();
  for (const finding of findings) {
    if (!finding.patched) continue;
    const list = byDate.get(finding.date) ?? [];
    list.push(finding);
    byDate.set(finding.date, list);
  }

  for (const slice of slices) {
    const ymd = toUtcYmd(slice.date);
    const dayFindings = byDate.get(ymd);
    if (!dayFindings?.length) continue;

    const nextData: Record<string, ISkuSliceDataItem> = {
      ...((slice.data ?? {}) as Record<string, ISkuSliceDataItem>),
    };
    for (const finding of dayFindings) {
      if (!finding.patched) continue;
      nextData[finding.productId] = finding.patched;
    }

    await SkuSlice.updateOne({ _id: slice._id }, { $set: { data: nextData } });
    slice.data = nextData;
  }
}

function buildFindings(
  dates: Date[],
  dataByDate: Map<number, Record<string, unknown>>,
  skuMeta: Map<string, SkuMeta>
): PackFlipFinding[] {
  const findings: PackFlipFinding[] = [];
  for (const productId of collectProductIds(dataByDate)) {
    const series: SeriesDay[] = dates.map((date) => ({
      dateMs: date.getTime(),
      point: readPackFlipPoint(dataByDate.get(date.getTime())?.[productId]),
    }));
    const decisions = decidePackFlipPatchesForSeries(series);
    for (const decision of decisions) {
      findings.push(toFinding(productId, skuMeta.get(productId), dates, decision));
    }
  }
  return findings;
}

export async function reviewPackFlipsUtil(
  input: ReviewPackFlipsInput
): Promise<PackFlipReviewResult> {
  const konkName = input.konkName;
  const dates = [...input.dates]
    .map((d) => addUtcDays(d, 0))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) {
    return emptyResult(konkName, input.apply, dates);
  }

  const slices = (await SkuSlice.find({ konkName, date: { $in: dates } })
    .select("date data")
    .lean()) as LeanSlice[];

  const dataByDate = new Map<number, Record<string, unknown>>();
  for (const date of dates) {
    dataByDate.set(date.getTime(), {});
  }
  for (const slice of slices) {
    dataByDate.set(addUtcDays(slice.date, 0).getTime(), slice.data ?? {});
  }

  const skuMeta = await loadSkuMetaByProductId(konkName);
  const findings = buildFindings(dates, dataByDate, skuMeta);

  const patched = findings.filter((f) => f.kind === "inverse");
  const priceOnly = findings.filter((f) => f.kind === "price-only");
  const ambiguous = findings.filter((f) => f.kind === "ambiguous");

  if (input.apply && patched.length > 0) {
    await applyInversePatches(slices, patched);
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
