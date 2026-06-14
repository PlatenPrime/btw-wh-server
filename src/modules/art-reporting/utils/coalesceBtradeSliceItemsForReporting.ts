import type { IBtradeSliceDataItem } from "../../btrade-slices/models/BtradeSlice.js";

export type BtradeReportingCoalescedPoint = {
  quantity: number | null;
  price: number | null;
};

export type BtradeReportingCarry = {
  lastQuantity: number | null;
  lastPrice: number | null;
};

/**
 * Значение годится для рядов отчётности: конечное число и не sentinel -1.
 */
export function isValidBtradeSliceMetricValue(v: unknown): v is number {
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  if (v === -1) return false;
  return true;
}

/** Предыдущий календарный день ключа среза (UTC-сутки как в хранилище). */
export function btradeSliceDateMinusDays(sliceDate: Date, days: number): Date {
  const d = new Date(sliceDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

/**
 * Forward-fill для отчётов Btrade: -1 и пропуски не обновляют carry.
 */
export function coalesceBtradeSliceItemsAlongDates(
  dates: Date[],
  getItem: (d: Date) => IBtradeSliceDataItem | null | undefined,
  initial: BtradeReportingCarry = { lastQuantity: null, lastPrice: null },
): BtradeReportingCoalescedPoint[] {
  let lastQuantity = initial.lastQuantity;
  let lastPrice = initial.lastPrice;
  const out: BtradeReportingCoalescedPoint[] = [];

  for (const d of dates) {
    const item = getItem(d);
    const rawQ = item?.quantity;
    const rawP = item?.price;
    if (isValidBtradeSliceMetricValue(rawQ)) lastQuantity = rawQ;
    if (isValidBtradeSliceMetricValue(rawP)) lastPrice = rawP;
    out.push({
      quantity: lastQuantity,
      price: lastPrice,
    });
  }

  return out;
}
