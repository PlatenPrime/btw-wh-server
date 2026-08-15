import { jitterMs } from "../../../utils/jitterMs.js";

export const GRABO_SKU_SYNC_JITTER_MIN_MS = 2500;
export const GRABO_SKU_SYNC_JITTER_MAX_MS = 7000;

export function getGraboSkuSyncJitterDelayMs(
  minMs = GRABO_SKU_SYNC_JITTER_MIN_MS,
  maxMs = GRABO_SKU_SYNC_JITTER_MAX_MS
): number {
  return jitterMs(minMs, maxMs);
}
