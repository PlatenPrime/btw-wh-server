import { SkuStockBand } from "../../../../sku-stock-bands/models/SkuStockBand.js";
import {
  correctManualBandSpikesForRangeUtil,
  type CorrectManualBandSpikesForRangeResult,
} from "../../../utils/correctManualBandSpikesForRangeUtil.js";
import type { BatchCorrectStockBandInput } from "../schemas/batchCorrectStockBandSchema.js";

export type BatchCorrectStockBandOkResult = {
  ok: true;
  bandId: string;
  result: CorrectManualBandSpikesForRangeResult;
};

export type BatchCorrectStockBandFailResult = {
  ok: false;
  code: "BAND_NOT_FOUND";
  message: string;
};

export type BatchCorrectStockBandResult =
  BatchCorrectStockBandOkResult | BatchCorrectStockBandFailResult;

export type BatchCorrectStockBandOptions = {
  signal?: AbortSignal;
  onProgress?: (done: number, total: number, message?: string) => void;
};

/**
 * Apply RTL band-spike correction for selected productIds using saved band (incl. normalMax).
 */
export async function batchCorrectStockBandUtil(
  input: BatchCorrectStockBandInput,
  options?: BatchCorrectStockBandOptions,
): Promise<BatchCorrectStockBandResult> {
  const stockBand = await SkuStockBand.findById(input.bandId).lean();
  if (!stockBand) {
    return { ok: false, code: "BAND_NOT_FOUND", message: "Sku stock band not found" };
  }

  const result = await correctManualBandSpikesForRangeUtil({
    konkName: stockBand.konk.name,
    stockMin: stockBand.stockMin,
    stockMax: stockBand.stockMax,
    normalMax: stockBand.normalMax,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    productIds: input.productIds,
    apply: true,
    signal: options?.signal,
    onProgress: options?.onProgress,
  });

  return {
    ok: true,
    bandId: String(stockBand._id),
    result,
  };
}
