import { Sku } from "../../../../skus/models/Sku.js";
import { mapSliceDocsToRangeItems, } from "../../../../slices/utils/mapSliceDocsToRangeItems.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregateSkuSlices, sliceDataProjectForSingleProductId, } from "../../../utils/sliceDataAggregationStages.js";
export async function getSkuSliceRangeUtil(input) {
    const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
    if (!sku)
        return { ok: false };
    const productKey = sku.productId?.trim();
    if (!productKey)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const docs = await aggregateSkuSlices([
        {
            $match: {
                konkName: sku.konkName,
                date: { $gte: dateFrom, $lte: dateTo },
            },
        },
        { $sort: { date: 1 } },
        sliceDataProjectForSingleProductId(productKey),
    ]);
    return { ok: true, data: mapSliceDocsToRangeItems(docs, productKey) };
}
