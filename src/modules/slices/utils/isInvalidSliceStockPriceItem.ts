import { isFullMinusOneStockPrice } from "./isInvalidSliceStockResult.js";

/**
 * Позиция в data среза (stock/quantity + price) считается «невалидной»:
 * полный -1/-1 или цена не конечное неотрицательное число.
 * Держать в sync с invalidSliceEntryMongoCondition.
 */
export function isInvalidSliceStockPriceItem(
  stockOrQuantity: unknown,
  price: unknown
): boolean {
  if (isFullMinusOneStockPrice(stockOrQuantity, price)) return true;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return true;
  }
  return false;
}
