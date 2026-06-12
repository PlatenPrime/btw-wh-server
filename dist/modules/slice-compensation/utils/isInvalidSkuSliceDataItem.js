import { isInvalidSliceStockPriceItem } from "../../slices/utils/isInvalidSliceStockPriceItem.js";
/**
 * Позиция в SkuSlice.data считается «невалидной» для компенсации.
 * @see isInvalidSliceStockPriceItem
 */
export function isInvalidSkuSliceDataItem(stock, price) {
    return isInvalidSliceStockPriceItem(stock, price);
}
