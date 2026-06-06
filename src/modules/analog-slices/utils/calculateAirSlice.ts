import { runAnalogSliceForKonkUtil, type AnalogSliceKonkResult } from "./runAnalogSliceForKonkUtil.js";

/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента Air.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateAirSlice(): Promise<AnalogSliceKonkResult> {
  return runAnalogSliceForKonkUtil("air", new Date());
}
