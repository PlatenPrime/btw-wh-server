import { createLogger } from "../../../logging/createLogger.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  BALUN_FAKE_STOCK_KONK_NAME,
  BALUN_FAKE_STOCK_LOOKBACK_DAYS,
} from "../../slices/config/balunFakeStockSentinel.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { afterSkuSliceStockMutation } from "../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";
import { SkuSlice } from "../models/SkuSlice.js";
import {
  computeBalunFakeStockPatches,
  type BalunFakeStockPatch,
  type BalunFakeStockSkip,
  type BalunStockDay,
} from "./correctBalunFakeStockSpikes.js";
import { addUtcDays, toUtcYmd } from "./reviewPackFlipsUtil.js";

const log = createLogger({ module: "sku-slices", job: "balun-fake-stock" });

export type CorrectBalunFakeStockSpikesInput = {
  /** Сколько дней от asOf включительно править (1 = только asOf). */
  daysBack: number;
  /** Правый край окна (ключ среза). По умолчанию toSliceDate(now). */
  asOf?: Date;
  /** Писать ли патчи в БД. По умолчанию true. */
  apply?: boolean;
  /** Дней lookback слева от окна. По умолчанию BALUN_FAKE_STOCK_LOOKBACK_DAYS. */
  lookbackDays?: number;
};

export type BalunFakeStockFinding = {
  productId: string;
  date: string;
  from: number;
  to: number;
};

export type BalunFakeStockSkippedFinding = {
  productId: string;
  date: string;
  reason: "no-adequate-neighbor";
};

export type CorrectBalunFakeStockSpikesResult = {
  konkName: string;
  apply: boolean;
  daysBack: number;
  windowDates: string[];
  patched: BalunFakeStockFinding[];
  skipped: BalunFakeStockSkippedFinding[];
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
): CorrectBalunFakeStockSpikesResult {
  return {
    konkName: BALUN_FAKE_STOCK_KONK_NAME,
    apply,
    daysBack,
    windowDates: windowDates.map(toUtcYmd),
    patched: [],
    skipped: [],
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
): Map<string, BalunStockDay[]> {
  const productIds = collectProductIds(dataByDate);
  const map = new Map<string, BalunStockDay[]>();
  for (const productId of productIds) {
    const series: BalunStockDay[] = loadDates.map((date) => ({
      dateMs: date.getTime(),
      stock: readStock(dataByDate.get(date.getTime())?.[productId]),
    }));
    map.set(productId, series);
  }
  return map;
}

async function applyPatches(
  slices: LeanSlice[],
  patches: BalunFakeStockPatch[]
): Promise<void> {
  const byDate = new Map<string, BalunFakeStockPatch[]>();
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

function toFindings(patches: BalunFakeStockPatch[]): BalunFakeStockFinding[] {
  return patches.map((p) => ({
    productId: p.productId,
    date: toUtcYmd(new Date(p.dateMs)),
    from: p.from,
    to: p.to,
  }));
}

function toSkippedFindings(
  skipped: BalunFakeStockSkip[]
): BalunFakeStockSkippedFinding[] {
  return skipped.map((s) => ({
    productId: s.productId,
    date: toUtcYmd(new Date(s.dateMs)),
    reason: s.reason,
  }));
}

/**
 * Коррекция фейкового stock у balun (диапазоны 4990–5000 ∪ 9950–10000)
 * за окно [asOf-(daysBack-1) .. asOf].
 * Замена: ближайший адекватный слева, иначе справа.
 * Lookback слева от окна нужен, чтобы найти адекватный остаток слева.
 */
export async function correctBalunFakeStockSpikesUtil(
  input: CorrectBalunFakeStockSpikesInput
): Promise<CorrectBalunFakeStockSpikesResult> {
  const daysBack = Math.floor(input.daysBack);
  if (!Number.isFinite(daysBack) || daysBack < 1) {
    throw new Error("correctBalunFakeStockSpikesUtil: daysBack must be >= 1");
  }

  const apply = input.apply !== false;
  const lookbackDays =
    input.lookbackDays ?? BALUN_FAKE_STOCK_LOOKBACK_DAYS;
  if (!Number.isFinite(lookbackDays) || lookbackDays < 0) {
    throw new Error(
      "correctBalunFakeStockSpikesUtil: lookbackDays must be >= 0"
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
    konkName: BALUN_FAKE_STOCK_KONK_NAME,
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
  const { patches, skipped } = computeBalunFakeStockPatches(
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
        konkName: BALUN_FAKE_STOCK_KONK_NAME,
        dayD: new Date(dateMs),
        productIds: [...productIds],
      });
    }
  }

  const result: CorrectBalunFakeStockSpikesResult = {
    konkName: BALUN_FAKE_STOCK_KONK_NAME,
    apply,
    daysBack,
    windowDates: windowDates.map(toUtcYmd),
    patched: toFindings(patches),
    skipped: toSkippedFindings(skipped),
  };

  if (result.patched.length > 0 || result.skipped.length > 0) {
    log.info(
      {
        patched: result.patched.length,
        skipped: result.skipped.length,
        daysBack,
        asOf: toUtcYmd(asOf),
      },
      "balun fake stock correction"
    );
  }

  return result;
}
