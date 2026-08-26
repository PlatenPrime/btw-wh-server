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
 * Air: ×2 из‑за жёсткого egress/WAF на Railway.
 */
export const SKU_SLICE_REQUEST_JITTER_BY_KONK: Readonly<
  Record<string, SkuSliceRequestJitterRange>
> = {
  air: {
    minMs: SKU_SLICE_REQUEST_JITTER_MIN_MS * 2,
    maxMs: SKU_SLICE_REQUEST_JITTER_MAX_MS * 2,
  },
};

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
