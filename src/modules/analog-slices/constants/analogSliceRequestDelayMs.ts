import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";

/** Дефолтная пауза между запросами при сборе AnalogSlice. */
export const ANALOG_SLICE_REQUEST_DELAY_MS = 1000;

/**
 * Per-konk override поверх дефолта (ключ — нормализованное имя).
 * Air: ×2 из‑за жёсткого egress/WAF на Railway.
 */
export const ANALOG_SLICE_REQUEST_DELAY_BY_KONK: Readonly<
  Record<string, number>
> = {
  air: ANALOG_SLICE_REQUEST_DELAY_MS * 2,
};

/**
 * Пауза для konk: override из карты или дефолт 1000 ms.
 */
export function resolveAnalogSliceRequestDelayMs(konkName: string): number {
  const key = normalizeCompetitorName(konkName);
  const override = ANALOG_SLICE_REQUEST_DELAY_BY_KONK[key];
  if (typeof override === "number" && Number.isFinite(override) && override >= 0) {
    return override;
  }
  return ANALOG_SLICE_REQUEST_DELAY_MS;
}
