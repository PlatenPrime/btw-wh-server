import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregateSkuSlices, sliceDataProjectForSingleProductId, } from "../../../utils/sliceDataAggregationStages.js";
import { buildSkuSliceExcelForSkus, } from "../../../utils/buildSkuSliceExcel.js";
export async function getSkuSliceExcelUtil(input) {
    const sku = await Sku.findById(input.skuId).lean();
    if (!sku)
        return { ok: false };
    const productKey = sku.productId?.trim();
    if (!productKey)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const slices = await aggregateSkuSlices([
        {
            $match: {
                konkName: sku.konkName,
                date: { $gte: dateFrom, $lte: dateTo },
            },
        },
        { $sort: { date: 1 } },
        sliceDataProjectForSingleProductId(productKey),
    ]);
    const byDate = new Map();
    for (const sl of slices) {
        const t = toSliceDate(sl.date).getTime();
        byDate.set(t, (sl.data ?? {}));
    }
    const row = {
        title: sku.title,
        url: sku.url,
        productId: productKey,
        konkName: sku.konkName,
        prodName: sku.prodName,
        createdAt: sku.createdAt,
    };
    const [konkDoc, prodDoc] = await Promise.all([
        Konk.findOne({ name: sku.konkName }).select("title").lean(),
        Prod.findOne({ name: sku.prodName }).select("title").lean(),
    ]);
    const titles = {
        competitorTitle: (konkDoc?.title ?? "").trim(),
        producerName: (prodDoc?.title ?? "").trim(),
    };
    const { buffer, fileName } = await buildSkuSliceExcelForSkus([row], dateFrom, dateTo, (kn, pid, d) => {
        if (kn !== sku.konkName || pid !== productKey)
            return undefined;
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[pid];
    }, titles);
    return { ok: true, buffer, fileName };
}
