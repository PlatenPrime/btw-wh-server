import type { SkuSliceAbortReason } from "../../modules/sku-reporting/constants/skuSliceRequestJitterMs.js";

export type { SkuSliceAbortReason };

export type KonkSliceStats = {
  konkName: string;
  count: number;
  invalid: number;
  errors: number;
  total: number;
  abortReason?: SkuSliceAbortReason;
};

const ABORT_REASON_LABEL: Record<SkuSliceAbortReason, string> = {
  origin_blocked: "ORIGIN_BLOCKED",
  unsupported: "UNSUPPORTED",
  consecutive_invalid: "CONSECUTIVE_INVALID",
};

export function formatKonkSliceLine(stats: KonkSliceStats): string {
  const base = `${stats.konkName}: ✅${stats.count} / ❌${stats.errors} / ⚠️${stats.invalid}`;
  if (!stats.abortReason) {
    return base;
  }
  return `${base} — abort ${ABORT_REASON_LABEL[stats.abortReason]} remaining ${stats.errors}`;
}

export function formatKonkSliceReportLines(
  competitors: KonkSliceStats[]
): string[] {
  return competitors.map(formatKonkSliceLine);
}
