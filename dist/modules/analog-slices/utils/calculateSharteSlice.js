import { runAnalogSliceForKonkUtil } from "./runAnalogSliceForKonkUtil.js";
/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента Sharte.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateSharteSlice() {
    return runAnalogSliceForKonkUtil("sharte", new Date());
}
