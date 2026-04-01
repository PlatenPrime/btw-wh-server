import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { buildSliceMapsByKonk, enumerateReportingDates, getSliceItem, loadSkugrWithOrderedSkus, uniqueKonkNamesFromSkus, } from "../../../utils/skugrReporting.js";
export async function getSkugrDailySummaryUtil(input) {
    const loaded = await loadSkugrWithOrderedSkus(input.skugrId);
    if (!loaded)
        return { ok: false };
    const { skus } = loaded;
    if (skus.length === 0)
        return { ok: false };
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const konkNames = uniqueKonkNamesFromSkus(skus);
    const sliceDocs = await SkuSlice.find({
        konkName: { $in: konkNames },
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("konkName date data")
        .lean();
    const maps = buildSliceMapsByKonk(sliceDocs);
    const dates = enumerateReportingDates(dateFrom, dateTo);
    const perSku = [];
    for (const sku of skus) {
        const stocks = dates.map((d) => {
            const item = getSliceItem(maps, sku.konkName, sku.productId, d);
            if (!item)
                return null;
            const v = item.stock;
            return typeof v === "number" && Number.isFinite(v) ? v : null;
        });
        const salesSeq = computeSalesFromStockSequence(stocks);
        const sales = salesSeq.map((r) => r.sales);
        const revenue = dates.map((d, i) => {
            const item = getSliceItem(maps, sku.konkName, sku.productId, d);
            const price = item?.price;
            const p = typeof price === "number" && Number.isFinite(price) ? price : null;
            return computeRevenueForDay(sales[i], p);
        });
        perSku.push({ stocks, sales, revenue });
    }
    const data = dates.map((d, dayIndex) => {
        let stock = 0;
        let sales = 0;
        let revenue = 0;
        for (const row of perSku) {
            const st = row.stocks[dayIndex];
            if (typeof st === "number" && Number.isFinite(st))
                stock += st;
            sales += row.sales[dayIndex] ?? 0;
            revenue += row.revenue[dayIndex] ?? 0;
        }
        revenue = Math.round(revenue * 100) / 100;
        return {
            date: d.toISOString(),
            stock,
            sales,
            revenue,
        };
    });
    return { ok: true, data };
}
