import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { runCompensatingAnalogSlices } from "./runCompensatingAnalogSlices.js";
import { runCompensatingSkuSlices } from "./runCompensatingSkuSlices.js";

export type CompensatingSliceStats = {
  refetched: number;
  updated: number;
};

export type CompensatingSlicesForKonkResult = {
  konkName: string;
  sliceDate: Date;
  analog: CompensatingSliceStats;
  sku: CompensatingSliceStats;
};

export type RunCompensatingSlicesForKonkOptions = {
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
};

/**
 * Внеочередная компенсация сегодняшних AnalogSlice + SkuSlice для одного конкурента.
 */
export async function runCompensatingSlicesForKonk(
  konkName: string,
  options?: RunCompensatingSlicesForKonkOptions
): Promise<CompensatingSlicesForKonkResult> {
  const normalized = normalizeCompetitorName(konkName);
  const sliceDate = toSliceDate(new Date());

  const remapProgress =
    (offset: number, weight: number, label: string) =>
    (done: number, total: number, message?: string) => {
      const mappedDone = offset + Math.round((weight * done) / Math.max(total, 1));
      options?.onProgress?.(
        mappedDone,
        100,
        message ? `${label}: ${message}` : label
      );
    };

  if (options?.onProgress || options?.signal) {
    const analog = await runCompensatingAnalogSlices(sliceDate, {
      konkName: normalized,
      signal: options.signal,
      onProgress: remapProgress(0, 50, "Analog"),
    });
    const sku = await runCompensatingSkuSlices(sliceDate, {
      konkName: normalized,
      signal: options.signal,
      onProgress: remapProgress(50, 50, "SKU"),
    });
    return {
      konkName: normalized,
      sliceDate,
      analog,
      sku,
    };
  }

  const [analog, sku] = await Promise.all([
    runCompensatingAnalogSlices(sliceDate, { konkName: normalized }),
    runCompensatingSkuSlices(sliceDate, { konkName: normalized }),
  ]);
  return {
    konkName: normalized,
    sliceDate,
    analog,
    sku,
  };
}
