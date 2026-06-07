export type SliceStockResult = {
  stock: number;
  price: number;
};

/**
 * Невалидный исход среза: нет данных или sentinel -1 в stock/price.
 */
export function isInvalidSliceStockResult(
  item: SliceStockResult | null | undefined
): boolean {
  if (item == null) return true;
  return item.stock === -1 || item.price === -1;
}
