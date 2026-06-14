import {
  computeArtSalesPointsFromSeries,
  loadArtBtradeSliceSeries,
  type ArtBtradeSalesPoint,
} from "../../../../art-reporting/utils/loadArtBtradeSliceSeries.js";
import type { GetArtSalesRangeInput } from "../schemas/getArtSalesRangeSchema.js";

export type GetArtSalesRangeResult =
  | { ok: true; data: ArtBtradeSalesPoint[] }
  | { ok: false };

export async function getArtSalesRangeUtil(
  input: GetArtSalesRangeInput,
): Promise<GetArtSalesRangeResult> {
  const loaded = await loadArtBtradeSliceSeries({
    artikul: input.artikul,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  });
  if (!loaded.ok) return { ok: false };

  return {
    ok: true,
    data: computeArtSalesPointsFromSeries(
      loaded.datesReport,
      loaded.coalescedFull,
      loaded.reportIndexStart,
    ),
  };
}
