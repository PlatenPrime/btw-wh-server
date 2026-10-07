import { toSliceDate } from "../../../utils/sliceDate.js";

/**
 * Ключ месяца среза: UTC midnight 1-го числа того же календарного месяца,
 * что и `toSliceDate(d)` (YYYY-MM-01T00:00:00.000Z).
 */
export function toSliceMonthDate(d: Date): Date {
  const day = toSliceDate(d);
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1, 0, 0, 0, 0),
  );
}

/** YYYY-MM-DD ключ дня внутри `SkuSliceMonth.days`. */
export function toSliceMonthDayKey(d: Date): string {
  return toSliceDate(d).toISOString().slice(0, 10);
}
