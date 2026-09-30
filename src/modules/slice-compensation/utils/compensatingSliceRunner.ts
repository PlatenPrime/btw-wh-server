import { delay } from "../../../utils/delay.js";
import { jitterMs } from "../../../utils/jitterMs.js";
import { resolveSkuSliceRequestJitterMs } from "../../sku-reporting/constants/skuSliceRequestJitterMs.js";
import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import { logModuleInfo } from "../../../logging/logModuleError.js";

export type CompensatingSliceDoc = {
  konkName: string;
  data?: Record<string, unknown>;
};

export type CompensatingDataKeyWork = {
  konkName: string;
  dataKey: string;
};

export function buildCompensatingDataKeyQueue(
  docs: CompensatingSliceDoc[],
  excluded: Set<string>,
  shouldInclude: (item: unknown) => boolean
): CompensatingDataKeyWork[] {
  const queue: CompensatingDataKeyWork[] = [];
  for (const doc of docs) {
    const kn = doc.konkName ?? "";
    if (excluded.has(normalizeCompetitorName(kn))) continue;
    const data = doc.data ?? {};
    for (const [dataKey, item] of Object.entries(data)) {
      if (shouldInclude(item)) {
        queue.push({ konkName: kn, dataKey });
      }
    }
  }
  return queue;
}

export type CompensatingSliceRefetchStats = {
  refetched: number;
  updated: number;
};

export type CompensatingSliceJitterOverride = {
  minMs: number;
  maxMs: number;
};

/**
 * Последовательная обработка очереди с jitter между итерациями (как при сборе SkuSlice).
 * Пауза перед следующим item резолвится по его konkName (air — 2000–5000 мс),
 * если не передан явный jitterOverride (тесты / ручной форс).
 */
export type CompensatingSliceRefetchLoopOptions = {
  jitterOverride?: CompensatingSliceJitterOverride;
  onProgress?: (done: number, total: number, message?: string) => void;
  signal?: AbortSignal;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    throw err;
  }
}

export async function runCompensatingSliceRefetchLoop(
  queue: CompensatingDataKeyWork[],
  processItem: (
    work: CompensatingDataKeyWork
  ) => Promise<CompensatingSliceRefetchStats>,
  jitterOverrideOrOptions?:
    | CompensatingSliceJitterOverride
    | CompensatingSliceRefetchLoopOptions
): Promise<CompensatingSliceRefetchStats> {
  const options: CompensatingSliceRefetchLoopOptions =
    jitterOverrideOrOptions &&
    ("minMs" in jitterOverrideOrOptions || "maxMs" in jitterOverrideOrOptions)
      ? { jitterOverride: jitterOverrideOrOptions as CompensatingSliceJitterOverride }
      : ((jitterOverrideOrOptions as CompensatingSliceRefetchLoopOptions | undefined) ??
        {});

  let refetched = 0;
  let updated = 0;
  const progressTotal = Math.max(queue.length, 1);
  options.onProgress?.(0, progressTotal, "Starting compensating refetch");
  for (let i = 0; i < queue.length; i++) {
    throwIfAborted(options.signal);
    const work = queue[i]!;
    logModuleInfo("slice-compensation", "compensating slice refetch item start", {
      index: i + 1,
      total: queue.length,
      konkName: work.konkName,
      dataKey: work.dataKey,
    });
    const stats = await processItem(work);
    logModuleInfo("slice-compensation", "compensating slice refetch item done", {
      index: i + 1,
      total: queue.length,
      konkName: work.konkName,
      dataKey: work.dataKey,
      refetched: stats.refetched,
      updated: stats.updated,
    });
    refetched += stats.refetched;
    updated += stats.updated;
    options.onProgress?.(
      i + 1,
      progressTotal,
      `Item ${i + 1}/${queue.length}`
    );
    if (i < queue.length - 1) {
      throwIfAborted(options.signal);
      const next = queue[i + 1]!;
      const range =
        options.jitterOverride ?? resolveSkuSliceRequestJitterMs(next.konkName);
      await delay(jitterMs(range.minMs, range.maxMs));
    }
  }
  return { refetched, updated };
}
