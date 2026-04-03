import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregateSkuSlices, sliceDataProjectForSingleProductId, } from "../../../utils/sliceDataAggregationStages.js";
export async function getSkuSliceByDateUtil(input) {
    const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
    if (!sku)
        return null;
    const productKey = sku.productId?.trim();
    if (!productKey)
        return null;
    const sliceDate = toSliceDate(input.date);
    const [doc] = await aggregateSkuSlices([
        { $match: { konkName: sku.konkName, date: sliceDate } },
        { $limit: 1 },
        sliceDataProjectForSingleProductId(productKey),
    ]);
    if (!doc)
        return null;
    const item = doc.data?.[productKey];
    if (!item)
        return null;
    return { stock: item.stock, price: item.price };
}
