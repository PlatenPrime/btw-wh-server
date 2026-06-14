import { computeArtSalesPointsFromSeries, loadArtBtradeSliceSeries, } from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
export async function getArtSalesRangeUtil(input) {
    const loaded = await loadArtBtradeSliceSeries({
        artikul: input.artikul,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    if (!loaded.ok)
        return { ok: false };
    return {
        ok: true,
        data: computeArtSalesPointsFromSeries(loaded.datesReport, loaded.coalescedFull, loaded.reportIndexStart),
    };
}
