import { buildArtSalesExcel } from "../../../../art-reporting/utils/buildArtSalesExcel.js";
import { loadArtBtradeSliceSeries } from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
export async function getArtSalesExcelUtil(input) {
    const loaded = await loadArtBtradeSliceSeries({
        artikul: input.artikul,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    if (!loaded.ok)
        return { ok: false };
    if (loaded.datesReport.length === 0)
        return { ok: false };
    const { buffer, fileName } = await buildArtSalesExcel({
        artikul: loaded.artikul,
        artNameUkr: loaded.artNameUkr,
        datesReport: loaded.datesReport,
        coalescedReport: loaded.coalescedReport,
        coalescedFull: loaded.coalescedFull,
        reportIndexStart: loaded.reportIndexStart,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    return { ok: true, buffer, fileName };
}
