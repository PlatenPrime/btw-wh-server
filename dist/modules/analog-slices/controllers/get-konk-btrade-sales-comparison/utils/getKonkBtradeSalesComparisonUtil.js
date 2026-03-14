import { getKonkBtradeComparisonRangeUtil } from "../../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js";
import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../common/salesComparisonUtils.js";
export async function getKonkBtradeSalesComparisonUtil(input) {
    const rangeResult = await getKonkBtradeComparisonRangeUtil(input);
    if (!rangeResult.ok) {
        return { ok: false };
    }
    const { analogs } = rangeResult;
    const dayCount = analogs[0]?.items.length ?? 0;
    if (dayCount === 0) {
        return { ok: false };
    }
    const dayCompetitorSales = new Float64Array(dayCount);
    const dayCompetitorRevenue = new Float64Array(dayCount);
    const dayBtradeSales = new Float64Array(dayCount);
    const dayBtradeRevenue = new Float64Array(dayCount);
    for (const analog of analogs) {
        const analogStockByDay = analog.items.map((i) => i.analogStock);
        const btradeStockByDay = analog.items.map((i) => i.btradeStock);
        const analogSalesResults = computeSalesFromStockSequence(analogStockByDay);
        const btradeSalesResults = computeSalesFromStockSequence(btradeStockByDay);
        for (let d = 0; d < dayCount; d++) {
            const analogSales = analogSalesResults[d].sales;
            const btradeSales = btradeSalesResults[d].sales;
            const analogRevenue = computeRevenueForDay(analogSales, analog.items[d].analogPrice);
            const btradeRevenue = computeRevenueForDay(btradeSales, analog.items[d].btradePrice);
            dayCompetitorSales[d] += analogSales;
            dayCompetitorRevenue[d] += analogRevenue;
            dayBtradeSales[d] += btradeSales;
            dayBtradeRevenue[d] += btradeRevenue;
        }
    }
    let totalCompetitorSales = 0;
    let totalBtradeSales = 0;
    let totalCompetitorRevenue = 0;
    let totalBtradeRevenue = 0;
    const days = [];
    for (let d = 0; d < dayCount; d++) {
        const compSales = dayCompetitorSales[d];
        const compRevenue = Math.round(dayCompetitorRevenue[d] * 100) / 100;
        const bSales = dayBtradeSales[d];
        const bRevenue = Math.round(dayBtradeRevenue[d] * 100) / 100;
        totalCompetitorSales += compSales;
        totalCompetitorRevenue += compRevenue;
        totalBtradeSales += bSales;
        totalBtradeRevenue += bRevenue;
        days.push({
            date: analogs[0].items[d].date.toISOString(),
            competitorSales: compSales,
            competitorRevenue: compRevenue,
            btradeSales: bSales,
            btradeRevenue: bRevenue,
        });
    }
    totalCompetitorRevenue = Math.round(totalCompetitorRevenue * 100) / 100;
    totalBtradeRevenue = Math.round(totalBtradeRevenue * 100) / 100;
    const diffSalesPcs = totalBtradeSales - totalCompetitorSales;
    const diffRevenueUah = Math.round((totalBtradeRevenue - totalCompetitorRevenue) * 100) / 100;
    const diffSalesPct = totalCompetitorSales === 0
        ? null
        : Math.round((totalBtradeSales / totalCompetitorSales - 1) * 100 * 100) / 100;
    const diffRevenuePct = totalCompetitorRevenue === 0
        ? null
        : Math.round((totalBtradeRevenue / totalCompetitorRevenue - 1) * 100 * 100) / 100;
    return {
        ok: true,
        data: {
            days,
            summary: {
                totalCompetitorSales,
                totalBtradeSales,
                totalCompetitorRevenue,
                totalBtradeRevenue,
                diffSalesPcs,
                diffRevenueUah,
                diffSalesPct,
                diffRevenuePct,
            },
        },
    };
}
