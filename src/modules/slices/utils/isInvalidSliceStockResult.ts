export type SliceStockResult = {
  stock: number;
  price: number;
};

/**
 * Полный «негативный исход» в срезе: и остаток, и цена равны -1.
 */
export function isFullMinusOneStockPrice(
  stock: unknown,
  price: unknown,
): boolean {
  return stock === -1 && price === -1;
}

export function isFullMinusOneSliceStockResult(
  item: SliceStockResult | null | undefined,
): boolean {
  if (item == null) return false;
  return isFullMinusOneStockPrice(item.stock, item.price);
}

/**
 * Невалидный исход среза: нет данных или sentinel -1 в stock/price.
 */
export function isInvalidSliceStockResult(
  item: SliceStockResult | null | undefined
): boolean {
  if (item == null) return true;
  return item.stock === -1 || item.price === -1;
}
