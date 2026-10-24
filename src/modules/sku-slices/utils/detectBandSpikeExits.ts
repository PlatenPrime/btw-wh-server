import {
  findBandRunsInWindow,
  isManualBandStock,
  type RtlBandStockDay,
} from "./computeRtlBandSpikePatches.js";

export type BandSpikeExitRun = {
  dateFromMs: number;
  dateToMs: number;
  peakStock: number;
};

/**
 * Кандидаты discovery: contiguous in-band run в окне, после которого есть день
 * с finite stock вне [bandMin, bandMax]. Trailing run без exit — не кандидат.
 */
export function detectBandSpikeExits(
  series: RtlBandStockDay[],
  windowStartMs: number,
  windowEndMs: number,
  bandMin: number,
  bandMax: number,
): BandSpikeExitRun[] {
  const runs = findBandRunsInWindow(series, windowStartMs, windowEndMs, bandMin, bandMax);
  const out: BandSpikeExitRun[] = [];

  for (const run of runs) {
    const exitDay = series[run.endIndex + 1];
    const exitStock = exitDay?.stock;
    if (typeof exitStock !== "number" || !Number.isFinite(exitStock)) {
      continue;
    }
    if (isManualBandStock(exitStock, bandMin, bandMax)) {
      continue;
    }

    let peakStock = Number.NEGATIVE_INFINITY;
    for (let i = run.startIndex; i <= run.endIndex; i++) {
      const stock = series[i]!.stock!;
      if (stock > peakStock) peakStock = stock;
    }

    out.push({
      dateFromMs: series[run.startIndex]!.dateMs,
      dateToMs: series[run.endIndex]!.dateMs,
      peakStock,
    });
  }

  return out;
}
