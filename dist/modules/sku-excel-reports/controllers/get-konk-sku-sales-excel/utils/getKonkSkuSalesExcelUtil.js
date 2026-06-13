import { Konk } from "../../../../konks/models/Konk.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import { aggregateSkuSlices, sliceDataProjectForProductIdList, } from "../../../../sku-slices/utils/sliceDataAggregationStages.js";
import { formatDateHeader, safeFilePart, } from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { loadProdDisplayTitlesByName } from "../../../../sku-reporting/utils/prodDisplayTitles.js";
import { resolveKonkProdSkus } from "../../../../sku-reporting/utils/resolveKonkProdSkus.js";
import { buildSkuSalesExcelForSkus, computeSkuSalesPeriodMetrics, } from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";
export async function getKonkSkuSalesExcelUtil(input) {
    const resolved = await resolveKonkProdSkus({
        konk: input.konk,
        prod: input.prod,
        skugrIds: input.skugrIds,
    });
    if (resolved.length === 0)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const warmStart = sliceDateMinusDays(dateFrom, 1);
    const allowedProductIds = resolved.map((r) => r.productId);
    const slices = await aggregateSkuSlices([
        {
            $match: {
                konkName: input.konk,
                date: { $gte: warmStart, $lte: dateTo },
            },
        },
        { $sort: { date: 1 } },
        sliceDataProjectForProductIdList(allowedProductIds),
    ]);
    const byDate = new Map();
    for (const sl of slices) {
        byDate.set(toSliceDate(sl.date).getTime(), (sl.data ?? {}));
    }
    const [konkDoc, prodTitleByName] = await Promise.all([
        Konk.findOne({ name: input.konk }).select("title recountDays").lean(),
        loadProdDisplayTitlesByName(resolved.map((r) => r.prodName)),
    ]);
    const recountDays = (konkDoc?.recountDays ?? []).map(String);
    const recountDaysSet = new Set(recountDays);
    const competitorTitle = (konkDoc?.title ?? "").trim();
    const rows = resolved.map((r) => ({
        title: r.title,
        url: r.url,
        productId: r.productId,
        konkName: r.konkName,
        competitorTitle,
        producerName: prodTitleByName.get(r.prodName) ?? r.prodName,
        skugrTitle: r.skugrTitle,
    }));
    const getSliceItem = (kn, pid, d) => {
        if (kn !== input.konk)
            return undefined;
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[pid];
    };
    let rowsOrdered = rows;
    if (input.sortBy === "sales") {
        rowsOrdered = [...rows].sort((a, b) => {
            const ta = computeSkuSalesPeriodMetrics(a, dateFrom, dateTo, getSliceItem, recountDaysSet).totalSales;
            const tb = computeSkuSalesPeriodMetrics(b, dateFrom, dateTo, getSliceItem, recountDaysSet).totalSales;
            if (tb !== ta)
                return tb - ta;
            return a.productId.localeCompare(b.productId);
        });
    }
    else if (input.sortBy === "revenue") {
        rowsOrdered = [...rows].sort((a, b) => {
            const ta = computeSkuSalesPeriodMetrics(a, dateFrom, dateTo, getSliceItem, recountDaysSet).totalRevenue;
            const tb = computeSkuSalesPeriodMetrics(b, dateFrom, dateTo, getSliceItem, recountDaysSet).totalRevenue;
            if (tb !== ta)
                return tb - ta;
            return a.productId.localeCompare(b.productId);
        });
    }
    const { buffer } = await buildSkuSalesExcelForSkus(rowsOrdered, dateFrom, dateTo, getSliceItem, {
        summaryMode: "bottomOnly",
        summarySalesLabel: "Загальні продажі, шт",
        summaryRevenueLabel: "Загальна виручка, грн",
        recountDays,
    });
    const fileName = `sku_sales_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
    return { ok: true, buffer, fileName };
}
