import {
  SVBUM_FAKE_STOCK_THRESHOLD,
  SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS,
} from "../../slices/config/svbumFakeStockThreshold.js";

export type SvbumStockDay = {
  dateMs: number;
  stock: number | undefined;
};

export type SvbumFakeStockPatch = {
  productId: string;
  dateMs: number;
  from: number;
  to: number;
};

export type SvbumFakeStockComputeResult = {
  patches: SvbumFakeStockPatch[];
};

/** Фейковый остаток: строго больше SVBUM_FAKE_STOCK_THRESHOLD. */
export function isSvbumFakeStock(stock: number): boolean {
  return stock > SVBUM_FAKE_STOCK_THRESHOLD;
}

function addZeroPatch(
  patches: Map<string, SvbumFakeStockPatch>,
  productId: string,
  day: SvbumStockDay,
  windowStartMs: number,
  windowEndMs: number
): void {
  const { dateMs, stock } = day;
  if (typeof stock !== "number" || !Number.isFinite(stock)) return;
  if (stock === 0) return;
  if (dateMs < windowStartMs || dateMs > windowEndMs) return;

  patches.set(`${productId}:${dateMs}`, {
    productId,
    dateMs,
    from: stock,
    to: 0,
  });
}

/**
 * Для одного productId: обнуляет спайки > threshold и дни между парными спайками.
 * Хвостовой одиночный спайк обнуляется только после trailingGraceDays дней справа в series.
 * Парный сэндвич (два спайка) закрывается сразу, без ожидания grace.
 */
export function computeSvbumFakeStockPatchesForSeries(
  productId: string,
  series: SvbumStockDay[],
  windowStartMs: number,
  windowEndMs: number,
  trailingGraceDays: number = SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS
): SvbumFakeStockComputeResult {
  const spikeIndexes: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const stock = series[i]?.stock;
    if (typeof stock === "number" && isSvbumFakeStock(stock)) {
      spikeIndexes.push(i);
    }
  }

  const patchMap = new Map<string, SvbumFakeStockPatch>();

  for (let s = 0; s < spikeIndexes.length - 1; s++) {
    const left = spikeIndexes[s]!;
    const right = spikeIndexes[s + 1]!;
    for (let i = left; i <= right; i++) {
      const day = series[i];
      if (!day) continue;
      addZeroPatch(patchMap, productId, day, windowStartMs, windowEndMs);
    }
  }

  if (spikeIndexes.length === 1) {
    const spikeIdx = spikeIndexes[0]!;
    const daysAfter = series.length - 1 - spikeIdx;
    if (daysAfter >= trailingGraceDays) {
      const day = series[spikeIdx];
      if (day) {
        addZeroPatch(patchMap, productId, day, windowStartMs, windowEndMs);
      }
    }
  }

  return { patches: [...patchMap.values()] };
}

/** Патчи по всем productId. */
export function computeSvbumFakeStockPatches(
  seriesByProductId: Map<string, SvbumStockDay[]>,
  windowStartMs: number,
  windowEndMs: number,
  trailingGraceDays: number = SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS
): SvbumFakeStockComputeResult {
  const patches: SvbumFakeStockPatch[] = [];

  for (const [productId, series] of seriesByProductId) {
    const result = computeSvbumFakeStockPatchesForSeries(
      productId,
      series,
      windowStartMs,
      windowEndMs,
      trailingGraceDays
    );
    patches.push(...result.patches);
  }

  return { patches };
}
