import { CronJob } from "cron";
import { fillPosNameukrFromArtsUtil } from "./utils/fillPosNameukrFromArtsUtil.js";
/**
 * Запускает cron job для заполнения поля nameukr у позиций из справочника артикулов.
 * Каждый понедельник в 08:30 по киевскому времени.
 */
export function startFillPosNameukrFromArtsCron() {
    const job = new CronJob("0 30 8 * * 1", async () => {
        try {
            console.log(`[CRON Fill nameukr] Starting fill Pos nameukr from Arts...`);
            const result = await fillPosNameukrFromArtsUtil();
            console.log(`[CRON Fill nameukr] Completed: updated ${result.updatedCount} poses, skipped ${result.skippedArtikulsCount} artikuls without Art nameukr`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`[CRON Fill nameukr] Error:`, errorMessage);
        }
    }, null, true, "Europe/Kiev");
    console.log(`[CRON Fill nameukr] Started: Mondays at 08:30 (Kiev time)`);
    return job;
}
