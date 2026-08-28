import { isInvalidSliceStockResult } from "../../slices/utils/isInvalidSliceStockResult.js";

/**
 * Ключ SkuSlice.data уже содержит валидную точку (не missing, не -1 sentinel).
 */
export function isSkuSliceDataKeyFilled(item: unknown): boolean {
  if (item === null || typeof item !== "object") {
    return false;
  }
  const o = item as Record<string, unknown>;
  const stock = o.stock;
  const price = o.price;
  if (typeof stock !== "number" || typeof price !== "number") {
    return false;
  }
  return !isInvalidSliceStockResult({ stock, price });
}
