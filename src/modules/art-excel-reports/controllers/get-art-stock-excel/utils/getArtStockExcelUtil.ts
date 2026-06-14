import { buildArtStockExcel } from "../../../../art-reporting/utils/buildArtStockExcel.js";
import { loadArtBtradeSliceSeries } from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
import type { GetArtStockExcelInput } from "../schemas/getArtStockExcelSchema.js";

export type GetArtStockExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getArtStockExcelUtil(
  input: GetArtStockExcelInput,
): Promise<GetArtStockExcelResult> {
  const loaded = await loadArtBtradeSliceSeries({
    artikul: input.artikul,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });
  if (!loaded.ok) return { ok: false };
  if (loaded.datesReport.length === 0) return { ok: false };

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
