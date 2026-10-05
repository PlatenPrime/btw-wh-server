import { createLogger } from "../../../logging/createLogger.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  SVBUM_FAKE_STOCK_KONK_NAME,
  SVBUM_FAKE_STOCK_LOOKBACK_DAYS,
} from "../../slices/config/svbumFakeStockThreshold.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { SkuSlice } from "../models/SkuSlice.js";
import {
  computeSvbumFakeStockPatches,
  type SvbumFakeStockPatch,
  type SvbumStockDay,
} from "./correctSvbumFakeStockSpikes.js";
import { addUtcDays, toUtcYmd } from "./reviewPackFlipsUtil.js";

const log = createLogger({ module: "sku-slices", job: "svbum-fake-stock" });

export type CorrectSvbumFakeStockSpikesInput = {
  /** Сколько дней от asOf включительно править (1 = только asOf). */
  daysBack: number;
  /** Правый край окна (ключ среза). По умолчанию toSliceDate(now). */
  asOf?: Date;
  /** Писать ли патчи в БД. По умолчанию true. */
  apply?: boolean;
  /** Дней lookback слева от окна. По умолчанию SVBUM_FAKE_STOCK_LOOKBACK_DAYS. */
  lookbackDays?: number;
};

export type SvbumFakeStockFinding = {
  productId: string;
  date: string;
  from: number;
  to: number;
};

export type CorrectSvbumFakeStockSpikesResult = {
  konkName: string;
  apply: boolean;
  daysBack: number;
  windowDates: string[];
  patched: SvbumFakeStockFinding[];
};

type LeanSlice = {
  _id: unknown;
  date: Date;
  data?: Record<string, { stock?: number; price?: number } | unknown>;
};

function emptyResult(
  apply: boolean,
  daysBack: number,
  windowDates: Date[]
): CorrectSvbumFakeStockSpikesResult {
  return {
    konkName: SVBUM_FAKE_STOCK_KONK_NAME,
    apply,
    daysBack,
    windowDates: windowDates.map(toUtcYmd),
    patched: [],
  };
}

function readStock(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || typeof raw !== "object") {
    return undefined;
  }
  const stock = (raw as { stock?: unknown }).stock;
  return typeof stock === "number" && Number.isFinite(stock) ? stock : undefined;
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

function buildSeriesByProductId(
  loadDates: Date[],
  dataByDate: Map<number, Record<string, unknown>>
): Map<string, SvbumStockDay[]> {
  const productIds = collectProductIds(dataByDate);
  const map = new Map<string, SvbumStockDay[]>();
  for (const productId of productIds) {
    const series: SvbumStockDay[] = loadDates.map((date) => ({
      dateMs: date.getTime(),
      stock: readStock(dataByDate.get(date.getTime())?.[productId]),
    }));
    map.set(productId, series);
  }
  return map;
}

async function applyPatches(
  slices: LeanSlice[],
  patches: SvbumFakeStockPatch[]
): Promise<void> {
  const byDate = new Map<string, SvbumFakeStockPatch[]>();
  for (const patch of patches) {
    const ymd = toUtcYmd(new Date(patch.dateMs));
    const list = byDate.get(ymd) ?? [];
    list.push(patch);
    byDate.set(ymd, list);
  }

  for (const slice of slices) {
    const ymd = toUtcYmd(slice.date);
    const dayPatches = byDate.get(ymd);
    if (!dayPatches?.length) continue;

    const $set: Record<string, number> = {};
    for (const patch of dayPatches) {
      $set[`data.${patch.productId}.stock`] = patch.to;
    }
    await SkuSlice.updateOne({ _id: slice._id }, { $set });
  }
}

function toFindings(patches: SvbumFakeStockPatch[]): SvbumFakeStockFinding[] {
  return patches.map((p) => ({
    productId: p.productId,
    date: toUtcYmd(new Date(p.dateMs)),
    from: p.from,
    to: p.to,
  }));
}

/**
 * Коррекция фейкового stock > 900_000 у svbum (обнуление + сэндвич)
 * за окно [asOf-(daysBack-1) .. asOf].
 */
export async function correctSvbumFakeStockSpikesUtil(
  input: CorrectSvbumFakeStockSpikesInput
): Promise<CorrectSvbumFakeStockSpikesResult> {
  const daysBack = Math.floor(input.daysBack);
  if (!Number.isFinite(daysBack) || daysBack < 1) {
    throw new Error("correctSvbumFakeStockSpikesUtil: daysBack must be >= 1");
  }

  const apply = input.apply !== false;
  const lookbackDays =
    input.lookbackDays ?? SVBUM_FAKE_STOCK_LOOKBACK_DAYS;
  if (!Number.isFinite(lookbackDays) || lookbackDays < 0) {
    throw new Error(
      "correctSvbumFakeStockSpikesUtil: lookbackDays must be >= 0"
    );
  }

  const asOf = toSliceDate(input.asOf ?? new Date());
  const windowStart = addUtcDays(asOf, -(daysBack - 1));
  const windowDates = enumerateReportingDates(windowStart, asOf);
  const loadStart = addUtcDays(windowStart, -lookbackDays);
  const loadDates = enumerateReportingDates(loadStart, asOf);

  if (windowDates.length === 0) {
    return emptyResult(apply, daysBack, windowDates);
  }

  const slices = (await SkuSlice.find({
    konkName: SVBUM_FAKE_STOCK_KONK_NAME,
    date: { $gte: loadStart, $lte: asOf },
  })
    .select("date data")
    .lean()) as LeanSlice[];

  const dataByDate = new Map<number, Record<string, unknown>>();
  for (const date of loadDates) {
    dataByDate.set(date.getTime(), {});
  }
  for (const slice of slices) {
    dataByDate.set(
      addUtcDays(slice.date, 0).getTime(),
      (slice.data ?? {}) as Record<string, unknown>
    );
  }

  const seriesByProductId = buildSeriesByProductId(loadDates, dataByDate);
  const { patches } = computeSvbumFakeStockPatches(
    seriesByProductId,
    windowStart.getTime(),
    asOf.getTime()
  );

  if (apply && patches.length > 0) {
    await applyPatches(slices, patches);
    const byDay = new Map<number, Set<string>>();
    for (const patch of patches) {
      const set = byDay.get(patch.dateMs) ?? new Set<string>();
      set.add(patch.productId);
      byDay.set(patch.dateMs, set);
    }
    for (const [dateMs, productIds] of byDay) {
      await afterSkuSliceStockMutation({
        konkName: SVBUM_FAKE_STOCK_KONK_NAME,
        dayD: new Date(dateMs),
        productIds: [...productIds],
      });
    }
  }

  const result: CorrectSvbumFakeStockSpikesResult = {
    konkName: SVBUM_FAKE_STOCK_KONK_NAME,
    apply,
    daysBack,
    windowDates: windowDates.map(toUtcYmd),
    patched: toFindings(patches),
  };

  if (result.patched.length > 0) {
    log.info(
      {
        patched: result.patched.length,
        daysBack,
        asOf: toUtcYmd(asOf),
      },
      "svbum fake stock correction"
    );
  }

  return result;
}
