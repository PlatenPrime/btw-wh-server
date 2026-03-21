import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
export async function getSkuSliceRangeUtil(input) {
    const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
    if (!sku)
        return { ok: false };
    const productKey = sku.productId?.trim();
    if (!productKey)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const docs = await SkuSlice.find({
        konkName: sku.konkName,
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .sort({ date: 1 })
        .lean();
    const data = [];
    for (const doc of docs) {
        const dataRecord = (doc.data ?? {});
        const item = dataRecord[productKey];
        if (!item)
            continue;
        data.push({
            date: doc.date.toISOString(),
            stock: item.stock,
            price: item.price,
        });
    }
    return { ok: true, data };
}
