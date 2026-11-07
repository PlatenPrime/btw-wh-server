import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { runCompensatingSkuSlices } from "./runCompensatingSkuSlices.js";

export type CompensatingSliceStats = {
  refetched: number;
  updated: number;
};

export type CompensatingSlicesForKonkResult = {
  konkName: string;
  sliceDate: Date;
  sku: CompensatingSliceStats;
};

export type RunCompensatingSlicesForKonkOptions = {
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
};

/**
 * Внеочередная компенсация сегодняшних SkuSlice для одного конкурента.
 */
export async function runCompensatingSlicesForKonk(
  konkName: string,
  options?: RunCompensatingSlicesForKonkOptions,
): Promise<CompensatingSlicesForKonkResult> {
  const normalized = normalizeCompetitorName(konkName);
  const sliceDate = toSliceDate(new Date());

  const sku = await runCompensatingSkuSlices(sliceDate, {
    konkName: normalized,
    signal: options?.signal,
    onProgress: options?.onProgress
      ? (done, total, message) => {
          options.onProgress?.(done, total, message ? `SKU: ${message}` : "SKU");
        }
      : undefined,
  });

  return {
    konkName: normalized,
    sliceDate,
    sku,
  };
}
