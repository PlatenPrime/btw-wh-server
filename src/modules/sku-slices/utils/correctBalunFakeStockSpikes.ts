import {
  BALUN_FAKE_STOCK_MAX,
  BALUN_FAKE_STOCK_MIN,
} from "../../slices/config/balunFakeStockSentinel.js";

export type BalunStockDay = {
  dateMs: number;
  stock: number | undefined;
};

export type BalunFakeStockPatch = {
  productId: string;
  dateMs: number;
  from: number;
  to: number;
};

export type BalunFakeStockSkip = {
  productId: string;
  dateMs: number;
  reason: "no-adequate-left";
};

export type BalunFakeStockComputeResult = {
  patches: BalunFakeStockPatch[];
  skipped: BalunFakeStockSkip[];
};

/** Фейковый остаток: inclusive [BALUN_FAKE_STOCK_MIN, BALUN_FAKE_STOCK_MAX]. */
export function isBalunFakeStock(stock: number): boolean {
  return stock >= BALUN_FAKE_STOCK_MIN && stock <= BALUN_FAKE_STOCK_MAX;
}

/** Адекватный остаток: не в фейковом диапазоне и не ошибка скрапа -1. */
export function isAdequateBalunStock(stock: number): boolean {
  return !isBalunFakeStock(stock) && stock !== -1;
}

/**
 * Для одного productId: идя слева направо по series (включая lookback),
 * в окне [windowStartMs, windowEndMs] заменяет фейковый stock на lastAdequate.
 * Дни вне окна только обновляют lastAdequate.
 */
export function computeBalunFakeStockPatchesForSeries(
  productId: string,
  series: BalunStockDay[],
  windowStartMs: number,
  windowEndMs: number
): BalunFakeStockComputeResult {
  const patches: BalunFakeStockPatch[] = [];
  const skipped: BalunFakeStockSkip[] = [];
  let lastAdequate: number | undefined;

  for (const day of series) {
    const { dateMs, stock } = day;
    const inWindow = dateMs >= windowStartMs && dateMs <= windowEndMs;

    if (typeof stock !== "number" || !Number.isFinite(stock)) {
      continue;
    }

    if (isAdequateBalunStock(stock)) {
      lastAdequate = stock;
      continue;
    }

    if (!isBalunFakeStock(stock)) {
      continue;
    }

    if (!inWindow) {
      continue;
    }

    if (lastAdequate === undefined) {
      skipped.push({ productId, dateMs, reason: "no-adequate-left" });
      continue;
    }

    patches.push({
      productId,
      dateMs,
      from: stock,
      to: lastAdequate,
    });
  }

  return { patches, skipped };
}

/**
 * Патчи по всем productId. seriesByProductId — хронологические ряды с lookback.
 */
export function computeBalunFakeStockPatches(
  seriesByProductId: Map<string, BalunStockDay[]>,
  windowStartMs: number,
  windowEndMs: number
): BalunFakeStockComputeResult {
  const patches: BalunFakeStockPatch[] = [];
  const skipped: BalunFakeStockSkip[] = [];

  for (const [productId, series] of seriesByProductId) {
    const result = computeBalunFakeStockPatchesForSeries(
      productId,
      series,
      windowStartMs,
      windowEndMs
    );
    patches.push(...result.patches);
    skipped.push(...result.skipped);
  }

  return { patches, skipped };
}
