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
 * Пауза перед следующим item резолвится по его konkName (air — ×2),
 * если не передан явный jitterOverride (тесты / ручной форс).
 */
export async function runCompensatingSliceRefetchLoop(
  queue: CompensatingDataKeyWork[],
  processItem: (
    work: CompensatingDataKeyWork
  ) => Promise<CompensatingSliceRefetchStats>,
  jitterOverride?: CompensatingSliceJitterOverride
): Promise<CompensatingSliceRefetchStats> {
  let refetched = 0;
  let updated = 0;
  for (let i = 0; i < queue.length; i++) {
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
    if (i < queue.length - 1) {
      const next = queue[i + 1]!;
      const range =
        jitterOverride ?? resolveSkuSliceRequestJitterMs(next.konkName);
      await delay(jitterMs(range.minMs, range.maxMs));
    }
  }
  return { refetched, updated };
}
