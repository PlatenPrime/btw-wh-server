import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { formatDateHeader, safeFilePart, } from "../../../utils/buildSkuSliceExcel.js";
import { buildSkuSalesExcelForSkus, } from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";
export async function getKonkSkuSalesExcelUtil(input) {
    const skus = await Sku.find({
        konkName: input.konk,
        prodName: input.prod,
    })
        .sort({ productId: 1 })
        .lean();
    if (skus.length === 0)
        return { ok: false };
    const rowsBase = skus
        .map((sku) => ({
        title: sku.title,
        url: sku.url,
        productId: (sku.productId ?? "").trim(),
        konkName: sku.konkName,
        prodName: sku.prodName,
    }))
        .filter((row) => row.productId !== "");
    if (rowsBase.length === 0)
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
        byDate.set(toSliceDate(sl.date).getTime(), (sl.data ?? {}));
    }
    const [konkDoc, prodDoc] = await Promise.all([
        Konk.findOne({ name: input.konk }).select("title").lean(),
        Prod.findOne({ name: input.prod }).select("title").lean(),
    ]);
    const competitorTitle = (konkDoc?.title ?? "").trim();
    const producerName = (prodDoc?.title ?? "").trim();
    const rows = rowsBase.map((row) => ({
        title: row.title,
        url: row.url,
        productId: row.productId,
        konkName: row.konkName,
        competitorTitle,
        producerName,
    }));
    const { buffer } = await buildSkuSalesExcelForSkus(rows, dateFrom, dateTo, (kn, pid, d) => {
        if (kn !== input.konk)
            return undefined;
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[pid];
    }, {
        summaryMode: "bottomOnly",
        summarySalesLabel: "Загальні продажі, шт",
        summaryRevenueLabel: "Загальна виручка, грн",
    });
    const fileName = `sku_sales_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
    return { ok: true, buffer, fileName };
}
