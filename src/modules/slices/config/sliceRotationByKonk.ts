import { normalizeCompetitorName } from "./excludedCompetitors.js";

export type SliceRotationConfig = {
  cycleDays: number;
};

/**
 * Per-konk цикл server-среза: за `cycleDays` календарных дней Kyiv
 * каждый productId попадает в один bucket (hash % cycleDays).
 * Пустая карта — полный каталог каждый день (Air rotation выключен).
 */
export const SLICE_ROTATION_BY_KONK: Readonly<
  Record<string, SliceRotationConfig>
> = {};

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
