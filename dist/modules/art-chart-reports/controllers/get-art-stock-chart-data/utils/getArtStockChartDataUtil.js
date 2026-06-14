import { loadArtBtradeSliceSeries, quantityForChart, } from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
export async function getArtStockChartDataUtil(input) {
    const loaded = await loadArtBtradeSliceSeries({
        artikul: input.artikul,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    if (!loaded.ok)
        return { ok: false };
    const dayCount = loaded.datesReport.length;
    if (dayCount === 0)
        return { ok: false };
    const days = loaded.datesReport.map((date, i) => ({
        date: date.toISOString(),
        quantity: quantityForChart(loaded.coalescedReport[i].quantity),
    }));
    const firstDayQuantity = days[0].quantity;
    const lastDayQuantity = days[dayCount - 1].quantity;
    const diffQuantity = lastDayQuantity - firstDayQuantity;
    const diffQuantityPct = firstDayQuantity === 0
        ? null
        : Math.round((diffQuantity / firstDayQuantity) * 100 * 100) / 100;
    return {
        ok: true,
        data: {
            days,
            summary: {
                firstDayQuantity,
                lastDayQuantity,
                diffQuantity,
                diffQuantityPct,
            },
        },
    };
}
