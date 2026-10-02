import {
  BALUN_FAKE_STOCK_MAX,
  BALUN_FAKE_STOCK_MIN,
  BALUN_FAKE_STOCK_SPIKE_MAX,
  BALUN_FAKE_STOCK_SPIKE_MIN,
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
  reason: "no-adequate-neighbor";
};

export type BalunFakeStockComputeResult = {
  patches: BalunFakeStockPatch[];
  skipped: BalunFakeStockSkip[];
};

/** Фейковый остаток: inclusive [SPIKE_MIN, SPIKE_MAX] ∪ [MIN, MAX]. */
export function isBalunFakeStock(stock: number): boolean {
  if (stock >= BALUN_FAKE_STOCK_SPIKE_MIN && stock <= BALUN_FAKE_STOCK_SPIKE_MAX) {
    return true;
  }
  return stock >= BALUN_FAKE_STOCK_MIN && stock <= BALUN_FAKE_STOCK_MAX;
}

/** Адекватный остаток: не fake и не ошибка скрапа -1. */
export function isAdequateBalunStock(stock: number): boolean {
  return !isBalunFakeStock(stock) && stock !== -1;
}

function findNextAdequateStock(
  series: BalunStockDay[],
  fromIndex: number
): number | undefined {
  for (let i = fromIndex + 1; i < series.length; i++) {
    const stock = series[i]?.stock;
    if (
      typeof stock === "number" &&
      Number.isFinite(stock) &&
      isAdequateBalunStock(stock)
    ) {
      return stock;
    }
  }
  return undefined;
}

/**
 * Для одного productId: идя слева направо по series (включая lookback),
 * в окне [windowStartMs, windowEndMs] заменяет фейковый stock на lastAdequate.
 * Если слева нет адекватного — берёт ближайший адекватный справа.
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

  for (let i = 0; i < series.length; i++) {
    const day = series[i]!;
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

    const replacement =
      lastAdequate !== undefined
        ? lastAdequate
        : findNextAdequateStock(series, i);

    if (replacement === undefined) {
      skipped.push({ productId, dateMs, reason: "no-adequate-neighbor" });
      continue;
    }

    patches.push({
      productId,
      dateMs,
      from: stock,
      to: replacement,
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
