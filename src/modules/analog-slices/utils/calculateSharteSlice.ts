import {
  runAnalogSliceForKonkUtil,
  type AnalogSliceKonkResult,
} from "./runAnalogSliceForKonkUtil.js";

/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента Sharte.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateSharteSlice(): Promise<AnalogSliceKonkResult> {
  return runAnalogSliceForKonkUtil("sharte", new Date());
}
