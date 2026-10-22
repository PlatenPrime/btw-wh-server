import {
  BALUN_MANUAL_BAND_MAX,
  BALUN_MANUAL_BAND_MIN,
} from "../../slices/config/balunFakeStockSentinel.js";

export type RtlBandStockDay = {
  dateMs: number;
  stock: number | undefined;
};

export type RtlBalunBandSpikePatch = {
  dateMs: number;
  from: number;
  to: number;
};

export type RtlBalunBandSpikeSkipReason =
  "missing-left" | "missing-right" | "not-sandwich-left" | "not-sandwich-right";

export type RtlBalunBandSpikeSkip = {
  dateFromMs: number;
  dateToMs: number;
  reason: RtlBalunBandSpikeSkipReason;
};

export type RtlBalunBandSpikeComputeResult = {
  patches: RtlBalunBandSpikePatch[];
  skipped: RtlBalunBandSpikeSkip[];
};

export function isBalunManualBandStock(
  stock: number,
  bandMin: number = BALUN_MANUAL_BAND_MIN,
  bandMax: number = BALUN_MANUAL_BAND_MAX,
): boolean {
  return stock >= bandMin && stock <= bandMax;
}

/** «Небольшое»: ниже band, finite, не сентинел -1. */
export function isBalunManualSmallStock(
  stock: number,
  bandMin: number = BALUN_MANUAL_BAND_MIN,
): boolean {
  return Number.isFinite(stock) && stock !== -1 && stock < bandMin;
}

type BandRun = { startIndex: number; endIndex: number };

function findBandRunsInWindow(
  series: RtlBandStockDay[],
  windowStartMs: number,
  windowEndMs: number,
  bandMin: number,
  bandMax: number,
): BandRun[] {
  const runs: BandRun[] = [];
  let runStart: number | null = null;

  for (let i = 0; i < series.length; i++) {
    const day = series[i]!;
    const inWindow = day.dateMs >= windowStartMs && day.dateMs <= windowEndMs;
    const stock = day.stock;
    const inBand =
      inWindow &&
      typeof stock === "number" &&
      Number.isFinite(stock) &&
      isBalunManualBandStock(stock, bandMin, bandMax);

    if (inBand) {
      if (runStart === null) runStart = i;
      continue;
    }

    if (runStart !== null) {
      runs.push({ startIndex: runStart, endIndex: i - 1 });
      runStart = null;
    }
  }

  if (runStart !== null) {
    runs.push({ startIndex: runStart, endIndex: series.length - 1 });
  }

  return runs;
}

function readFiniteStock(day: RtlBandStockDay | undefined): number | undefined {
  const stock = day?.stock;
  return typeof stock === "number" && Number.isFinite(stock) ? stock : undefined;
}

/**
 * RTL-коррекция sandwich small → [bandMin, bandMax] → small.
 * Последний день run = rightAnchor; левее: corrected[i] = corrected[i+1] + max(0, orig[i]-orig[i+1]).
 * Dump band→small в продажи не входит.
 *
 * `series` — хронологический плотный ряд, включающий соседей ±1 относительно окна.
 * Патчи только для дней run внутри [windowStartMs, windowEndMs].
 */
export function computeRtlBalunBandSpikePatches(
  series: RtlBandStockDay[],
  windowStartMs: number,
  windowEndMs: number,
  options?: { bandMin?: number; bandMax?: number },
): RtlBalunBandSpikeComputeResult {
  const bandMin = options?.bandMin ?? BALUN_MANUAL_BAND_MIN;
  const bandMax = options?.bandMax ?? BALUN_MANUAL_BAND_MAX;
  const patches: RtlBalunBandSpikePatch[] = [];
  const skipped: RtlBalunBandSpikeSkip[] = [];

  const runs = findBandRunsInWindow(series, windowStartMs, windowEndMs, bandMin, bandMax);

  for (const run of runs) {
    const leftDay = series[run.startIndex - 1];
    const rightDay = series[run.endIndex + 1];
    const leftStock = readFiniteStock(leftDay);
    const rightStock = readFiniteStock(rightDay);
    const runFromMs = series[run.startIndex]!.dateMs;
    const runToMs = series[run.endIndex]!.dateMs;

    if (leftStock === undefined) {
      skipped.push({ dateFromMs: runFromMs, dateToMs: runToMs, reason: "missing-left" });
      continue;
    }
    if (rightStock === undefined) {
      skipped.push({ dateFromMs: runFromMs, dateToMs: runToMs, reason: "missing-right" });
      continue;
    }
    if (!isBalunManualSmallStock(leftStock, bandMin)) {
      skipped.push({ dateFromMs: runFromMs, dateToMs: runToMs, reason: "not-sandwich-left" });
      continue;
    }
    if (!isBalunManualSmallStock(rightStock, bandMin)) {
      skipped.push({ dateFromMs: runFromMs, dateToMs: runToMs, reason: "not-sandwich-right" });
      continue;
    }

    const corrected: number[] = new Array(run.endIndex - run.startIndex + 1);
    corrected[corrected.length - 1] = rightStock;

    for (let offset = corrected.length - 2; offset >= 0; offset--) {
      const seriesIndex = run.startIndex + offset;
      const orig = series[seriesIndex]!.stock!;
      const origNext = series[seriesIndex + 1]!.stock!;
      const sales = Math.max(0, orig - origNext);
      corrected[offset] = corrected[offset + 1]! + sales;
    }

    for (let offset = 0; offset < corrected.length; offset++) {
      const seriesIndex = run.startIndex + offset;
      const from = series[seriesIndex]!.stock!;
      const to = corrected[offset]!;
      if (from === to) continue;
      patches.push({
        dateMs: series[seriesIndex]!.dateMs,
        from,
        to,
      });
    }
  }

  return { patches, skipped };
}
