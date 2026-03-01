import { runAnalogSliceForKonkUtil } from "./runAnalogSliceForKonkUtil.js";

/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента Yumi.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateYumiSlice(): Promise<{
  saved: boolean;
  count: number;
}> {
  return runAnalogSliceForKonkUtil("yumi", new Date());
}
