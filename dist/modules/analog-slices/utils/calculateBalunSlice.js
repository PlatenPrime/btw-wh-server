import { runAnalogSliceForKonkUtil } from "./runAnalogSliceForKonkUtil.js";
/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента Balun.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateBalunSlice() {
    return runAnalogSliceForKonkUtil("balun", new Date());
}
