import { isInvalidSkuSliceDataItem } from "./isInvalidSkuSliceDataItem.js";

/**
 * Позиция SkuSlice нуждается в повторном опросе: полный -1/-1 или цена не конечное неотрицательное число.
 */
export function shouldRefetchSkuSliceItem(item: unknown): boolean {
  if (item === null || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return isInvalidSkuSliceDataItem(o.stock, o.price);
}
