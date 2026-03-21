import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { buildSkuSliceExcelForSkus, formatDateHeader, safeFilePart, } from "../../../utils/buildSkuSliceExcel.js";
export async function getKonkSkuSliceExcelUtil(input) {
    const skus = await Sku.find({
        konkName: input.konk,
        prodName: input.prod,
    })
        .sort({ productId: 1 })
        .lean();
    if (skus.length === 0)
        return { ok: false };
    const rows = skus
        .map((s) => ({
        title: s.title,
        url: s.url,
        productId: (s.productId ?? "").trim(),
        konkName: s.konkName,
        prodName: s.prodName,
    }))
        .filter((r) => r.productId !== "");
    if (rows.length === 0)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const slices = await SkuSlice.find({
        konkName: input.konk,
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .lean();
    const byDate = new Map();
    for (const sl of slices) {
        const t = toSliceDate(sl.date).getTime();
        byDate.set(t, (sl.data ?? {}));
    }
    const { buffer } = await buildSkuSliceExcelForSkus(rows, dateFrom, dateTo, (kn, pid, d) => {
        if (kn !== input.konk)
            return undefined;
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[pid];
    });
    const fileName = `sku_slice_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
    return { ok: true, buffer, fileName };
}
