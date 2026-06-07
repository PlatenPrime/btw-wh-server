import { isFullMinusOneStockPrice } from "../../slices/utils/isInvalidSliceStockResult.js";

/**
 * Позиция в SkuSlice.data считается «невалидной» для компенсации: полный -1/-1
 * или цена не конечное неотрицательное число.
 * Держать в sync с Mongo-выражением в getSkuSliceUtil (invalidSliceEntryCondition).
 */
export function isInvalidSkuSliceDataItem(
  stock: unknown,
  price: unknown
): boolean {
  if (isFullMinusOneStockPrice(stock, price)) return true;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return true;
  }
  return false;
}
