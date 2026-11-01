import type { ISkuSliceDataItem } from "../../models/skuSliceTypes.js";
import { rescaleDojdevikSlicePoint } from "./rescaleDojdevikSlicePoint.js";

export type RescaleMonthDaysResult = {
  days: Record<string, ISkuSliceDataItem>;
  changedDayKeys: string[];
};

/** Рескейл всех дней month-дока. Возвращает новый объект days + ключи изменений. */
export function rescaleDojdevikMonthDays(
  days: Record<string, ISkuSliceDataItem> | null | undefined,
  packOld: number,
  packNew: number,
): RescaleMonthDaysResult {
  const source = days ?? {};
  const next: Record<string, ISkuSliceDataItem> = {};
  const changedDayKeys: string[] = [];

  for (const [dayKey, point] of Object.entries(source)) {
    if (!point || typeof point !== "object") {
      continue;
    }
    const patched = rescaleDojdevikSlicePoint(point, packOld, packNew);
    next[dayKey] = patched;
    if (patched.stock !== point.stock || patched.price !== point.price) {
      changedDayKeys.push(dayKey);
    }
  }

  return { days: next, changedDayKeys };
}
