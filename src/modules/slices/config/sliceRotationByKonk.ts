import { normalizeCompetitorName } from "./excludedCompetitors.js";

export type SliceRotationConfig = {
  cycleDays: number;
};

/**
 * Per-konk цикл server-среза: за `cycleDays` календарных дней Kyiv
 * каждый productId попадает в один bucket (hash % cycleDays).
 */
export const SLICE_ROTATION_BY_KONK: Readonly<
  Record<string, SliceRotationConfig>
> = {
  air: { cycleDays: 3 },
};

export function resolveSliceRotationConfig(
  konkName: string
): SliceRotationConfig | null {
  const key = normalizeCompetitorName(konkName);
  const config = SLICE_ROTATION_BY_KONK[key];
  if (!config || config.cycleDays < 2) {
    return null;
  }
  return config;
}
