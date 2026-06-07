import { runAnalogSliceForKonkUtil, } from "./runAnalogSliceForKonkUtil.js";
/** Конкуренты, для которых cron собирает ежедневные срезы аналогов. */
export const ANALOG_SLICE_KONK_NAMES = [
    "air",
    "balun",
    "sharte",
    "yumi",
    "yumin",
];
/**
 * Собирает ежедневный срез остатков и цен аналогов конкурента.
 * Дата среза — текущая дата на момент вызова (для cron в 04:00 Kiev).
 */
export async function calculateAnalogSlice(konkName) {
    return runAnalogSliceForKonkUtil(konkName, new Date());
}
