import { isFullMinusOneStockPrice } from "../../slices/utils/isInvalidSliceStockResult.js";
/**
 * Полный «негативный исход» в срезе: и остаток, и цена равны -1 (неактивная страница / ошибка парсера).
 */
export function isFullMinusOneSliceItem(item) {
    if (item === null || typeof item !== "object")
        return false;
    const o = item;
    return isFullMinusOneStockPrice(o.stock, o.price);
}
