import { SkuSlice } from "../../../models/SkuSlice.js";
import { isInvalidSliceStockResult } from "../../../../slices/utils/isInvalidSliceStockResult.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { AIR_CLIENT_SLICE_KONK } from "../../../constants/airClientSlice.js";
import { loadSlicedSkusForKonk } from "../../../utils/loadSlicedSkusForKonk.js";
function isPendingSliceItem(item) {
    if (!item)
        return true;
    return isInvalidSliceStockResult(item);
}
/**
 * Air SKU из sliced-групп, у которых в сегодняшнем SkuSlice нет записи
 * или stock/price содержат sentinel -1. Нет документа среза = все pending.
 */
export async function getAirClientPendingUtil(now = new Date()) {
    const sliceDate = toSliceDate(now);
    const skus = await loadSlicedSkusForKonk(AIR_CLIENT_SLICE_KONK, "_id productId title url");
    const sliceDoc = await SkuSlice.findOne({
        konkName: AIR_CLIENT_SLICE_KONK,
        date: sliceDate,
    })
        .select("data")
        .lean();
    const data = (sliceDoc?.data ?? {});
    const items = [];
    for (const sku of skus) {
        const productId = (sku.productId ?? "").trim();
        if (!productId)
            continue;
        const url = (sku.url ?? "").trim();
        if (!url)
            continue;
        if (!isPendingSliceItem(data[productId]))
            continue;
        items.push({
            skuId: sku._id.toString(),
            productId,
            title: (sku.title ?? "").trim(),
            url,
        });
    }
    return { date: sliceDate, items };
}
