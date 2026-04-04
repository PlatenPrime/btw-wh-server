import { loadKonkProdSkuChartSeries } from "../../../utils/konkProdSkuChartCore.js";
export async function getKonkProdSkuStockChartDataUtil(input) {
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
    const days = loaded.dateIso.map((date, d) => ({
        date,
        competitorStock: loaded.competitorStock[d],
        btradeStock: loaded.btradeStock[d],
    }));
    const firstCompetitor = loaded.competitorStock[0];
    const lastCompetitor = loaded.competitorStock[dayCount - 1];
    const firstBtrade = loaded.btradeStock[0];
    const lastBtrade = loaded.btradeStock[dayCount - 1];
    const diffCompetitorStock = lastCompetitor - firstCompetitor;
    const diffBtradeStock = lastBtrade - firstBtrade;
    const diffCompetitorStockPct = firstCompetitor === 0
        ? null
        : Math.round((diffCompetitorStock / firstCompetitor) * 100 * 100) / 100;
    const diffBtradeStockPct = firstBtrade === 0
        ? null
        : Math.round((diffBtradeStock / firstBtrade) * 100 * 100) / 100;
    return {
        ok: true,
        data: {
            days,
            summary: {
                firstDayCompetitorStock: firstCompetitor,
                lastDayCompetitorStock: lastCompetitor,
                firstDayBtradeStock: firstBtrade,
                lastDayBtradeStock: lastBtrade,
                diffCompetitorStock,
                diffBtradeStock,
                diffCompetitorStockPct,
                diffBtradeStockPct,
            },
        },
    };
}
