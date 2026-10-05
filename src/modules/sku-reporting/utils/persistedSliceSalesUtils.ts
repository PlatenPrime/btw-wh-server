import { isValidSliceMetricValue } from "../../slices/utils/isInvalidSliceStockResult.js";
import {
  applyRecountDayToSales,
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../slices/utils/salesComparisonUtils.js";

export type PersistedDaySales = {
  salesPcs: number;
  salesUah: number;
  isDeliveryDay: boolean;
};

/**
 * Остаток/цена для расчёта sales: finite и не sentinel -1, иначе null.
 * С -1 в формуле дельты не считаем.
 */
export function toMetricForPersistedSales(raw: unknown): number | null {
  return isValidSliceMetricValue(raw) ? raw : null;
}

/**
 * Raw sentinel -1 (или нечисло) на текущем дне — красный флаг: sales = 0.
 */
export function isRedFlagSliceStock(raw: unknown): boolean {
  return raw === -1;
}

/**
 * Дневные salesPcs/salesUah без coalesce: -1 → 0, delivery → 0, иначе max(0, prev-curr).
 * Используется write-path rollup (SkuManufacturerDaySales).
 */
export function computePersistedDaySales(params: {
  prevStockRaw: unknown;
  currStockRaw: unknown;
  currPriceRaw: unknown;
  date: Date;
  recountDays?: ReadonlySet<string>;
}): PersistedDaySales {
  const { prevStockRaw, currStockRaw, currPriceRaw, date, recountDays } =
    params;

  if (isRedFlagSliceStock(currStockRaw)) {
    return { salesPcs: 0, salesUah: 0, isDeliveryDay: false };
  }

  const prev = toMetricForPersistedSales(prevStockRaw);
  const curr = toMetricForPersistedSales(currStockRaw);
  const seq = computeSalesFromStockSequence([prev, curr]);
  const day = seq[1]!;
  let sales = day.sales;

  if (recountDays) {
    sales = applyRecountDayToSales(sales, date, recountDays);
  }

  const price = toMetricForPersistedSales(currPriceRaw);
  return {
    salesPcs: sales,
    salesUah: computeRevenueForDay(sales, price),
    isDeliveryDay: day.isDeliveryDay,
  };
}
