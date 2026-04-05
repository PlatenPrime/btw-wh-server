import type { ISkuSliceDataItem } from "../models/SkuSlice.js";

export type ReportingCoalescedPoint = {
  stock: number | null;
  price: number | null;
};

export type ReportingCarry = {
  lastStock: number | null;
  lastPrice: number | null;
};

/**
 * Значение годится для рядов отчётности: конечное число и не sentinel -1 (нет данных в срезе).
 */
export function isValidSkuSliceMetricValue(v: unknown): v is number {
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  if (v === -1) return false;
  return true;
}

/** Предыдущий календарный день ключа среза (UTC-сутки как в хранилище). */
export function sliceDateMinusDays(sliceDate: Date, days: number): Date {
  const d = new Date(sliceDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * Forward-fill для отчётов: -1 и пропуски не обновляют carry; в точке дня отдаём последний валидный stock/price слева.
 */
export function coalesceSkuSliceItemsAlongDates(
  dates: Date[],
  getItem: (d: Date) => ISkuSliceDataItem | null | undefined,
  initial: ReportingCarry = { lastStock: null, lastPrice: null },
): ReportingCoalescedPoint[] {
  let lastStock = initial.lastStock;
  let lastPrice = initial.lastPrice;
  const out: ReportingCoalescedPoint[] = [];

  for (const d of dates) {
    const item = getItem(d);
    const rawS = item?.stock;
    const rawP = item?.price;
    if (isValidSkuSliceMetricValue(rawS)) lastStock = rawS;
    if (isValidSkuSliceMetricValue(rawP)) lastPrice = rawP;
    out.push({
      stock: lastStock,
      price: lastPrice,
    });
  }

  return out;
}
