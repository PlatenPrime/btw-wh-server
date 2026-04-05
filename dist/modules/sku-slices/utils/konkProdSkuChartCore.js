import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../analog-slices/controllers/common/salesComparisonUtils.js";
import { Art } from "../../arts/models/Art.js";
import { Sku } from "../../skus/models/Sku.js";
import { aggregateBtradeSlices, sliceDataProjectForArtikulList, } from "../../btrade-slices/utils/btradeSliceAggregationStages.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { aggregateDailySkuSliceMetricsForSkus } from "./aggregateDailySkuSliceMetricsForSkus.js";
import { enumerateReportingDates } from "./skugrReporting.js";
/**
 * Конкурент: SKU с `konkName` + `prodName` из query (точное совпадение `prodName`),
 * срезы SkuSlice. Btrade: артикулы из Art, у которых `prodName` (trim, без учёта регистра)
 * совпадает с query `prod`; по ним — BtradeSlice. Поле Sku.btradeAnalog не используется.
 *
 * Зарезервировано: если после trim `prod` строго равен `"all"`, конкурент — все SKU с
 * данным `konkName` (без фильтра по производителю); Btrade — все уникальные непустые
 * `artikul` из Art. Для Excel `konk`/`prod` это значение не обрабатывается особым образом.
 *
 * При очень большом числе артикулов при необходимости можно батчить
 * `sliceDataProjectForArtikulList` по чанкам и суммировать в памяти.
 */
export async function loadKonkProdSkuChartSeries(input) {
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const isAllProd = input.prod.trim() === "all";
    const skuDocs = await Sku.find(isAllProd
        ? { konkName: input.konk }
        : { konkName: input.konk, prodName: input.prod })
        .sort({ productId: 1 })
        .select("konkName productId")
        .lean();
    const skus = [];
    for (const doc of skuDocs) {
        const pid = (doc.productId ?? "").trim();
        if (!pid)
            continue;
        skus.push({
            konkName: doc.konkName,
            productId: pid,
        });
    }
    if (skus.length === 0)
        return { ok: false };
    const compMetrics = await aggregateDailySkuSliceMetricsForSkus(skus.map((s) => ({ konkName: s.konkName, productId: s.productId })), dateFrom, dateTo);
    if (!compMetrics.ok)
        return { ok: false };
    const dates = enumerateReportingDates(dateFrom, dateTo);
    const dayCount = dates.length;
    if (dayCount === 0)
        return { ok: false };
    const dateIso = compMetrics.data.map((d) => d.date);
    const competitorStock = compMetrics.data.map((d) => d.stock);
    const competitorSales = compMetrics.data.map((d) => d.sales);
    const competitorRevenue = compMetrics.data.map((d) => d.revenue);
    const arts = await Art.find(isAllProd
        ? {
            $expr: {
                $gt: [
                    {
                        $strLenCP: {
                            $trim: { input: { $ifNull: ["$artikul", ""] } },
                        },
                    },
                    0,
                ],
            },
        }
        : {
            $expr: {
                $eq: [
                    {
                        $toLower: {
                            $trim: { input: { $ifNull: ["$prodName", ""] } },
                        },
                    },
                    input.prod.trim().toLowerCase(),
                ],
            },
        })
        .select("artikul")
        .lean();
    const allowedArtikuls = [];
    const seenArt = new Set();
    for (const a of arts) {
        const ak = (a.artikul ?? "").trim();
        if (!ak || seenArt.has(ak))
            continue;
        seenArt.add(ak);
        allowedArtikuls.push(ak);
    }
    const btradeStock = new Float64Array(dayCount);
    const btradeSales = new Float64Array(dayCount);
    const btradeRevenue = new Float64Array(dayCount);
    if (allowedArtikuls.length > 0) {
        const sliceRows = await aggregateBtradeSlices([
            {
                $match: {
                    date: { $gte: dateFrom, $lte: dateTo },
                },
            },
            { $sort: { date: 1 } },
            sliceDataProjectForArtikulList(allowedArtikuls),
        ]);
        const byDate = new Map();
        for (const row of sliceRows) {
            const t = toSliceDate(row.date).getTime();
            byDate.set(t, (row.data ?? {}));
        }
        for (const artikul of allowedArtikuls) {
            const stocks = dates.map((d) => {
                const rec = byDate.get(toSliceDate(d).getTime());
                const item = rec?.[artikul];
                if (!item)
                    return null;
                const q = item.quantity;
                return typeof q === "number" && Number.isFinite(q) ? q : null;
            });
            const salesSeq = computeSalesFromStockSequence(stocks);
            for (let d = 0; d < dayCount; d++) {
                const item = byDate.get(toSliceDate(dates[d]).getTime())?.[artikul];
                const sales = salesSeq[d].sales;
                const price = item?.price;
                const p = typeof price === "number" && Number.isFinite(price) ? price : null;
                btradeSales[d] += sales;
                btradeRevenue[d] += computeRevenueForDay(sales, p);
                const q = item?.quantity;
                if (typeof q === "number" && Number.isFinite(q)) {
                    btradeStock[d] += q;
                }
            }
        }
    }
    const round2 = (x) => Math.round(x * 100) / 100;
    return {
        ok: true,
        dayCount,
        dateIso,
        competitorStock,
        competitorSales,
        competitorRevenue: competitorRevenue.map(round2),
        btradeStock: Array.from(btradeStock),
        btradeSales: Array.from(btradeSales),
        btradeRevenue: Array.from(btradeRevenue, round2),
    };
}
