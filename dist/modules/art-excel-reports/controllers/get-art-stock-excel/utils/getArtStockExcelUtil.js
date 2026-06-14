import { buildArtStockExcel } from "../../../../art-reporting/utils/buildArtStockExcel.js";
import { loadArtBtradeSliceSeries } from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
export async function getArtStockExcelUtil(input) {
    const loaded = await loadArtBtradeSliceSeries({
        artikul: input.artikul,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    if (!loaded.ok)
        return { ok: false };
    if (loaded.datesReport.length === 0)
        return { ok: false };
    const { buffer, fileName } = await buildArtStockExcel({
        artikul: loaded.artikul,
        artNameUkr: loaded.artNameUkr,
        datesReport: loaded.datesReport,
        coalescedReport: loaded.coalescedReport,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
    });
    return { ok: true, buffer, fileName };
}
