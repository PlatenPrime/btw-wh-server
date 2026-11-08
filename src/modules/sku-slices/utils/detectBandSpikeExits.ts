import {
  findBandRunsInWindow,
  isManualBandStock,
  isSandwichAnchor,
  type RtlBandStockDay,
} from "./computeRtlBandSpikePatches.js";

export type BandSpikeExitRun = {
  dateFromMs: number;
  dateToMs: number;
  peakStock: number;
};

function readFiniteStock(day: RtlBandStockDay | undefined): number | undefined {
  const stock = day?.stock;
  return typeof stock === "number" && Number.isFinite(stock) ? stock : undefined;
}

/**
 * Кандидаты discovery: contiguous in-band run в окне с валидным выходом.
 *
 * Без `normalMax` (legacy): exit = finite stock вне [bandMin, bandMax].
 * С `normalMax` (stock-band): sandwich — right ≤ normalMax; left отсутствует
 * или тоже ≤ normalMax. Trailing run без exit — не кандидат.
 */
export function detectBandSpikeExits(
  series: RtlBandStockDay[],
  windowStartMs: number,
  windowEndMs: number,
  bandMin: number,
  bandMax: number,
  normalMax?: number,
): BandSpikeExitRun[] {
  const runs = findBandRunsInWindow(series, windowStartMs, windowEndMs, bandMin, bandMax);
  const out: BandSpikeExitRun[] = [];
  const sandwichBand = normalMax !== undefined ? { bandMin, bandMax, normalMax } : undefined;

  for (const run of runs) {
    const exitDay = series[run.endIndex + 1];
    const exitStock = readFiniteStock(exitDay);
    if (exitStock === undefined) {
      continue;
    }

    if (sandwichBand) {
      if (!isSandwichAnchor(exitStock, sandwichBand)) {
        continue;
      }
      const leftStock = readFiniteStock(series[run.startIndex - 1]);
      if (leftStock !== undefined && !isSandwichAnchor(leftStock, sandwichBand)) {
        continue;
      }
    } else if (isManualBandStock(exitStock, bandMin, bandMax)) {
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
