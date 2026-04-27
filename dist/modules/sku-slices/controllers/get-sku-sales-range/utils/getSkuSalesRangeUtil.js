import { Sku } from "../../../../skus/models/Sku.js";
import { aggregateSkuSlices, sliceDataProjectForSingleProductId, } from "../../../utils/sliceDataAggregationStages.js";
import { coalesceSkuSliceItemsAlongDates, sliceDateMinusDays, } from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import { applyRecountDayToSales, computeRevenueForDay, computeSalesFromStockSequence, } from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { enumerateReportingDates } from "../../../utils/skugrReporting.js";
import { Konk } from "../../../../konks/models/Konk.js";
export async function getSkuSalesRangeUtil(input) {
    const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
    if (!sku)
        return { ok: false };
    const productKey = sku.productId?.trim();
    if (!productKey)
        return { ok: false };
    const konkDoc = await Konk.findOne({ name: sku.konkName })
        .select("recountDays")
        .lean();
    const recountDays = new Set((konkDoc?.recountDays ?? []).map(String));
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const warmStart = sliceDateMinusDays(dateFrom, 1);
    const docs = await aggregateSkuSlices([
        {
            $match: {
                konkName: sku.konkName,
                date: { $gte: warmStart, $lte: dateTo },
            },
        },
        { $sort: { date: 1 } },
        sliceDataProjectForSingleProductId(productKey),
    ]);
    const byDate = new Map();
    for (const doc of docs) {
        byDate.set(toSliceDate(doc.date).getTime(), (doc.data ?? {}));
    }
    const datesFull = enumerateReportingDates(warmStart, dateTo);
    const indexStart = datesFull.findIndex((d) => toSliceDate(d).getTime() >= toSliceDate(dateFrom).getTime());
    if (indexStart < 0)
        return { ok: false };
    const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) => {
        const rec = byDate.get(toSliceDate(d).getTime());
        return rec?.[productKey];
    });
    const datesReport = datesFull.slice(indexStart);
    const coalescedReport = coalesced.slice(indexStart);
    const stockByDay = coalescedReport.map((c) => c.stock);
    const salesResults = computeSalesFromStockSequence(stockByDay);
    const data = datesReport.map((d, i) => {
        const dayResult = salesResults[i];
        const sales = applyRecountDayToSales(dayResult.sales, d, recountDays);
        const priceVal = coalescedReport[i].price;
        const price = typeof priceVal === "number" && Number.isFinite(priceVal) ? priceVal : 0;
        const revenue = computeRevenueForDay(sales, priceVal ?? null);
        return {
            date: d.toISOString(),
            sales,
            revenue,
            price,
            isDeliveryDay: dayResult.isDeliveryDay,
        };
    });
    return { ok: true, data };
}
