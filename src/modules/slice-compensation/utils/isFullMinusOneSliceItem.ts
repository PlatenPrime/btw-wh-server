import { isFullMinusOneStockPrice } from "../../slices/utils/isInvalidSliceStockResult.js";

/**
 * Полный «негативный исход» в срезе: и остаток, и цена равны -1 (неактивная страница / ошибка парсера).
 */
export function isFullMinusOneSliceItem(item: unknown): boolean {
  if (item === null || typeof item !== "object") return false;
  const o = item as Record<string, unknown>;
  return isFullMinusOneStockPrice(o.stock, o.price);
}
