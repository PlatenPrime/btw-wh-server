import { isInvalidSkuSliceDataItem } from "./isInvalidSkuSliceDataItem.js";
/**
 * Позиция SkuSlice нуждается в повторном опросе: полный -1/-1 или цена не конечное неотрицательное число.
 */
export function shouldRefetchSkuSliceItem(item) {
    if (item === null || typeof item !== "object")
        return false;
    const o = item;
    return isInvalidSkuSliceDataItem(o.stock, o.price);
}
