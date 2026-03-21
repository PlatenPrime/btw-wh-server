import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
export async function getSkuSliceByDateUtil(input) {
    const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
    if (!sku)
        return null;
    const productKey = sku.productId?.trim();
    if (!productKey)
        return null;
    const sliceDate = toSliceDate(input.date);
    const doc = await SkuSlice.findOne({
        konkName: sku.konkName,
        date: sliceDate,
    })
        .select("data")
        .lean();
    if (!doc?.data)
        return null;
    const item = doc.data[productKey];
    if (!item)
        return null;
    return { stock: item.stock, price: item.price };
}
