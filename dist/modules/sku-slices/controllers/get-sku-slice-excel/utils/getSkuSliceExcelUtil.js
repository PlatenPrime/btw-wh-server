import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
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
    const slices = await SkuSlice.find({
        konkName: sku.konkName,
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .lean();
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
    };
    const { buffer, fileName } = await buildSkuSliceExcelForSkus([row], dateFrom, dateTo, (kn, pid, d) => {
        if (kn !== sku.konkName || pid !== productKey)
            return undefined;
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[pid];
    });
    return { ok: true, buffer, fileName };
}
