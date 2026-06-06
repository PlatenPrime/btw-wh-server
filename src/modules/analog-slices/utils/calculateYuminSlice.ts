import {
  runAnalogSliceForKonkUtil,
  type AnalogSliceKonkResult,
} from "./runAnalogSliceForKonkUtil.js";

/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента Yumin.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateYuminSlice(): Promise<AnalogSliceKonkResult> {
  return runAnalogSliceForKonkUtil("yumin", new Date());
}
