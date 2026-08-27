import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";

/** Дефолтная пауза между запросами при сборе/компенсации SKU-срезов. */
export const SKU_SLICE_REQUEST_JITTER_MIN_MS = 500;
export const SKU_SLICE_REQUEST_JITTER_MAX_MS = 1500;

export type SkuSliceRequestJitterRange = {
  minMs: number;
  maxMs: number;
};

/**
 * Per-konk override поверх дефолта (ключ — нормализованное имя).
 * Air: 2000–5000 мс — Cloudflare 520 при плотном egress.
 */
export const SKU_SLICE_REQUEST_JITTER_BY_KONK: Readonly<
  Record<string, SkuSliceRequestJitterRange>
> = {
  air: {
    minMs: 2000,
    maxMs: 5000,
  },
};

/** Кластерная пауза только для основного Air SKU-среза. */
export const AIR_SKU_SLICE_CLUSTER_SIZE = 10;
export const AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS = 20_000;
export const AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS = 40_000;

/**
 * Пауза после 10-го, 20-го, … SKU, но не после последнего.
 * @param completedCount сколько уже обработано (1-based)
 */
export function shouldPauseAirSkuSliceCluster(
  completedCount: number,
  total: number
): boolean {
  if (completedCount <= 0 || completedCount >= total) {
    return false;
  }
  return completedCount % AIR_SKU_SLICE_CLUSTER_SIZE === 0;
}

/**
 * Jitter-диапазон для konk: override из карты или дефолт 500–1500.
 */
export function resolveSkuSliceRequestJitterMs(
  konkName: string
): SkuSliceRequestJitterRange {
  const key = normalizeCompetitorName(konkName);
  const override = SKU_SLICE_REQUEST_JITTER_BY_KONK[key];
  if (override) {
    return { minMs: override.minMs, maxMs: override.maxMs };
  }
  return {
    minMs: SKU_SLICE_REQUEST_JITTER_MIN_MS,
    maxMs: SKU_SLICE_REQUEST_JITTER_MAX_MS,
  };
}
