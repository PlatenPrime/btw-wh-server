import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { formatDateHeader, safeFilePart, } from "../../../utils/buildSkuSliceExcel.js";
import { buildSkuSalesExcelForSkus, } from "./buildSkuSalesExcel.js";
export async function getSkuSalesExcelUtil(input) {
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
        byDate.set(toSliceDate(sl.date).getTime(), (sl.data ?? {}));
    }
    const [konkDoc, prodDoc] = await Promise.all([
        Konk.findOne({ name: sku.konkName }).select("title").lean(),
        Prod.findOne({ name: sku.prodName }).select("title").lean(),
    ]);
    const row = {
        title: sku.title,
        url: sku.url,
        productId: productKey,
        konkName: sku.konkName,
        competitorTitle: (konkDoc?.title ?? "").trim(),
        producerName: (prodDoc?.title ?? "").trim(),
    };
    const { buffer } = await buildSkuSalesExcelForSkus([row], dateFrom, dateTo, (kn, pid, d) => {
        if (kn !== sku.konkName || pid !== productKey)
            return undefined;
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[pid];
    }, { summaryMode: "perSku" });
    const fileName = `sku_sales_${safeFilePart(productKey)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
    return { ok: true, buffer, fileName };
}
