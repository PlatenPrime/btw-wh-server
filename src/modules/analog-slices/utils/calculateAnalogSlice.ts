import {
  runAnalogSliceForKonkUtil,
  type AnalogSliceKonkResult,
} from "./runAnalogSliceForKonkUtil.js";

/** Конкуренты, для которых cron собирает ежедневные срезы аналогов. */
export const ANALOG_SLICE_KONK_NAMES = [
  "air",
  "balun",
  "sharte",
  "yumi",
  "yumin",
] as const;

export type AnalogSliceKonkName = (typeof ANALOG_SLICE_KONK_NAMES)[number];

/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateAnalogSlice(
  konkName: AnalogSliceKonkName,
): Promise<AnalogSliceKonkResult> {
  return runAnalogSliceForKonkUtil(konkName, new Date());
}
