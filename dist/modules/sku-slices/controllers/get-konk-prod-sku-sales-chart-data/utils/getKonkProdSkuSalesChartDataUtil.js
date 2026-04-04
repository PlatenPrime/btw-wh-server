import { loadKonkProdSkuChartSeries } from "../../../utils/konkProdSkuChartCore.js";
export async function getKonkProdSkuSalesChartDataUtil(input) {
    const loaded = await loadKonkProdSkuChartSeries({
        konk: input.konk,
        prod: input.prod,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    if (!loaded.ok)
        return { ok: false };
    const dayCount = loaded.dayCount;
    if (dayCount === 0)
        return { ok: false };
    let totalCompetitorSales = 0;
    let totalBtradeSales = 0;
    let totalCompetitorRevenue = 0;
    let totalBtradeRevenue = 0;
    const days = loaded.dateIso.map((date, d) => {
        const compSales = loaded.competitorSales[d];
        const compRevenue = Math.round(loaded.competitorRevenue[d] * 100) / 100;
        const bSales = loaded.btradeSales[d];
        const bRevenue = Math.round(loaded.btradeRevenue[d] * 100) / 100;
        totalCompetitorSales += compSales;
        totalCompetitorRevenue += compRevenue;
        totalBtradeSales += bSales;
        totalBtradeRevenue += bRevenue;
        return {
            date,
            competitorSales: compSales,
            competitorRevenue: compRevenue,
            btradeSales: bSales,
            btradeRevenue: bRevenue,
        };
    });
    totalCompetitorRevenue = Math.round(totalCompetitorRevenue * 100) / 100;
    totalBtradeRevenue = Math.round(totalBtradeRevenue * 100) / 100;
    const diffSalesPcs = totalBtradeSales - totalCompetitorSales;
    const diffRevenueUah = Math.round((totalBtradeRevenue - totalCompetitorRevenue) * 100) / 100;
    const diffSalesPct = totalCompetitorSales === 0
        ? null
        : Math.round((totalBtradeSales / totalCompetitorSales - 1) * 100 * 100) /
            100;
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
