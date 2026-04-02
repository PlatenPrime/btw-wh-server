import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
export async function getSkuSliceUtil(input) {
    const { page, limit } = input;
    const sliceDate = toSliceDate(input.date);
    const doc = await SkuSlice.findOne({
        konkName: input.konkName,
        date: sliceDate,
    })
        .select("konkName date data")
        .lean();
    if (!doc)
        return null;
    const data = (doc.data ?? {});
    const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
    const total = sortedEntries.length;
    const start = (page - 1) * limit;
    const pageEntries = sortedEntries.slice(start, start + limit);
    const productIds = pageEntries.map(([productId]) => productId);
    const skus = productIds.length > 0
        ? (await Sku.find({ productId: { $in: productIds } })
            .lean()
            .exec())
        : [];
    const skuByProductId = new Map();
    for (const sku of skus) {
        skuByProductId.set(sku.productId, sku);
    }
    const items = pageEntries.map(([productId, metrics]) => ({
        productId,
        stock: metrics.stock,
        price: metrics.price,
        sku: skuByProductId.get(productId) ?? null,
    }));
    const totalPages = Math.ceil(total / limit) || 0;
    return {
        konkName: doc.konkName,
        date: doc.date,
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
