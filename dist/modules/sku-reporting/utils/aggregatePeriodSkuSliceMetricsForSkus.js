import { applyRecountDayToSales, computeRevenueForDay, computeSalesFromStockSequence, } from "../../slices/utils/salesComparisonUtils.js";
import { Konk } from "../../konks/models/Konk.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { aggregateSkuSlices, sliceDataProjectForProductIdList, } from "../../sku-slices/utils/sliceDataAggregationStages.js";
import { coalesceSkuSliceItemsAlongDates, sliceDateMinusDays, } from "./coalesceSkuSliceItemsForReporting.js";
import { buildSliceMapsByKonk, enumerateReportingDates, getSliceItem, } from "./skugrReporting.js";
/**
 * Периодные итоги продаж/выручки по каждому SKU (порядок = входной массив).
 * Та же математика срезов, что у aggregateDailySkuSliceMetricsForSkus.
 */
export async function aggregatePeriodSkuSliceMetricsForSkus(skus, dateFrom, dateTo) {
    if (skus.length === 0)
        return { ok: false };
    const konkNames = [...new Set(skus.map((s) => s.konkName))];
    const allowedProductIds = [...new Set(skus.map((s) => s.productId))];
    const warmupStart = sliceDateMinusDays(dateFrom, 1);
    const sliceDocs = await aggregateSkuSlices([
        {
            $match: {
                konkName: { $in: konkNames },
                date: { $gte: warmupStart, $lte: dateTo },
            },
        },
        sliceDataProjectForProductIdList(allowedProductIds),
    ]);
    const maps = buildSliceMapsByKonk(sliceDocs);
    const datesFull = enumerateReportingDates(warmupStart, dateTo);
    const indexStart = datesFull.findIndex((d) => toSliceDate(d).getTime() >= toSliceDate(dateFrom).getTime());
    if (indexStart < 0 || indexStart >= datesFull.length)
        return { ok: false };
    const dates = datesFull.slice(indexStart);
    const konkDocs = await Konk.find({ name: { $in: konkNames } })
        .select("name recountDays")
        .lean();
    const recountDaysByKonk = new Map();
    for (const doc of konkDocs) {
        recountDaysByKonk.set(doc.name, new Set((doc.recountDays ?? []).map(String)));
    }
    const data = [];
    for (const sku of skus) {
        const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) => getSliceItem(maps, sku.konkName, sku.productId, d));
        const stocksFull = coalesced.map((c) => c.stock);
        const salesSeq = computeSalesFromStockSequence(stocksFull);
        let salesPcs = 0;
        let salesUah = 0;
        for (let i = indexStart; i < datesFull.length; i++) {
            const c = coalesced[i];
            const seq = salesSeq[i];
            const recountDays = recountDaysByKonk.get(sku.konkName) ?? new Set();
            const salesValue = applyRecountDayToSales(seq.sales, dates[i - indexStart], recountDays);
            salesPcs += salesValue;
            salesUah += computeRevenueForDay(salesValue, c.price);
        }
        data.push({
            salesPcs,
            salesUah: Math.round(salesUah * 100) / 100,
        });
    }
    return { ok: true, data };
}
