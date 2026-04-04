import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../analog-slices/controllers/common/salesComparisonUtils.js";
import { aggregateSkuSlices, sliceDataProjectForProductIdList, } from "./sliceDataAggregationStages.js";
import { buildSliceMapsByKonk, enumerateReportingDates, getSliceItem, } from "./skugrReporting.js";
/**
 * Дневные суммы по конкуренту (SkuSlice): остаток, продажи и выручка по тем же правилам, что skugr daily-summary.
 */
export async function aggregateDailySkuSliceMetricsForSkus(skus, dateFrom, dateTo) {
    if (skus.length === 0)
        return { ok: false };
    const konkNames = [...new Set(skus.map((s) => s.konkName))];
    const allowedProductIds = [...new Set(skus.map((s) => s.productId))];
    const sliceDocs = await aggregateSkuSlices([
        {
            $match: {
                konkName: { $in: konkNames },
                date: { $gte: dateFrom, $lte: dateTo },
            },
        },
        sliceDataProjectForProductIdList(allowedProductIds),
    ]);
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
