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

/** Кластерная пауза только для основного Air SKU-среза (каждые 10 fetch). */
export const AIR_SKU_SLICE_CLUSTER_SIZE = 10;
export const AIR_SKU_SLICE_CLUSTER_PAUSE_MIN_MS = 20_000;
export const AIR_SKU_SLICE_CLUSTER_PAUSE_MAX_MS = 40_000;

/** Блочная пауза Air (каждые 100 fetch, не на границе чанка). */
export const AIR_SKU_SLICE_BLOCK_SIZE = 100;
export const AIR_SKU_SLICE_BLOCK_PAUSE_MIN_MS = 4 * 60 * 1000;
export const AIR_SKU_SLICE_BLOCK_PAUSE_MAX_MS = 6 * 60 * 1000;

/** Max HTTP fetch на чанк air primary SKU-среза. */
export const AIR_SKU_SLICE_CHUNK_MAX_FETCHES = 1000;

/** Пауза между чанками air (45–60 мин). */
export const AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MIN_MS = 45 * 60 * 1000;
export const AIR_SKU_SLICE_INTER_CHUNK_PAUSE_MAX_MS = 60 * 60 * 1000;

/**
 * Сколько подряд soft-invalid (`-1` / null) до abort air-run
 * (тихий WAF/бан без CF 520).
 */
export const AIR_SKU_SLICE_CONSECUTIVE_INVALID_ABORT = 15;

export type AirSkuSlicePauseKind = "none" | "cluster" | "block";

export type SkuSliceAbortReason =
  | "origin_blocked"
  | "unsupported"
  | "consecutive_invalid";

export function isAirSkuSliceChunkKonk(konkName: string): boolean {
  return normalizeCompetitorName(konkName) === "air";
}

export function shouldEndAirSkuSliceChunk(
  fetchesInChunk: number,
  maxFetches: number = AIR_SKU_SLICE_CHUNK_MAX_FETCHES
): boolean {
  return fetchesInChunk >= maxFetches;
}

/**
 * Пауза после 10-го, 20-го, … SKU, но не после последнего.
 * @param completedCount сколько уже обработано (1-based)
 * @deprecated предпочитай resolveAirSkuSlicePauseKind — учитывает block/chunk
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
 * Какой ярус паузы после N fetch в чанке (не суммируются).
 * На границе чанка (1000) — `"none"`: inter-chunk делает runAirSkuSliceWithChunks.
 * На 100 — только block; на 10 (не 100/1000) — cluster.
 */
export function resolveAirSkuSlicePauseKind(
  fetchesInChunk: number,
  isLast: boolean
): AirSkuSlicePauseKind {
  if (isLast || fetchesInChunk <= 0) {
    return "none";
  }
  if (fetchesInChunk % AIR_SKU_SLICE_CHUNK_MAX_FETCHES === 0) {
    return "none";
  }
  if (fetchesInChunk % AIR_SKU_SLICE_BLOCK_SIZE === 0) {
    return "block";
  }
  if (fetchesInChunk % AIR_SKU_SLICE_CLUSTER_SIZE === 0) {
    return "cluster";
  }
  return "none";
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
