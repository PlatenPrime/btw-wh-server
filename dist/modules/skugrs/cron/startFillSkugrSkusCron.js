import { CronJob } from "cron";
import { summarizeBrowserError } from "../../browser/utils/browserRequest.js";
import { Skugr } from "../models/Skugr.js";
import { fillSkugrSkusFromBrowserUtil } from "../utils/fillSkugrSkusFromBrowserUtil.js";
/**
 * Еженедельно в воскресенье в 22:00 по Киеву:
 * последовательно перезаполняет SKU для всех skugr-групп.
 */
export function startFillSkugrSkusCron() {
    const job = new CronJob("0 0 22 * * 0", async () => {
        try {
            const skugrs = await Skugr.find().select("_id").lean().exec();
            console.log(`[CRON SkugrRefill] Starting weekly refill for ${skugrs.length} groups...`);
            if (skugrs.length === 0) {
                console.log("[CRON SkugrRefill] No groups found. Skipping.");
                return;
            }
            let successCount = 0;
            let errorCount = 0;
            for (const [index, skugr] of skugrs.entries()) {
                const skugrId = String(skugr._id);
                try {
                    const result = await fillSkugrSkusFromBrowserUtil(skugrId);
                    if (!result) {
                        console.warn(`[CRON SkugrRefill] Group ${skugrId} not found during refill (${index + 1}/${skugrs.length}).`);
                        continue;
                    }
                    successCount += 1;
                    console.log(`[CRON SkugrRefill] Done ${index + 1}/${skugrs.length}: ${skugrId} (created=${result.stats.created}, linked=${result.stats.linkedExisting}, skippedConflict=${result.stats.skippedProductIdConflict}).`);
                }
                catch (error) {
                    errorCount += 1;
                    const details = summarizeBrowserError(error);
                    console.error(`[CRON SkugrRefill] Error ${index + 1}/${skugrs.length} for ${skugrId}:`, details);
                }
            }
            console.log(`[CRON SkugrRefill] Finished: success=${successCount}, errors=${errorCount}, total=${skugrs.length}.`);
        }
        catch (error) {
            const details = summarizeBrowserError(error);
            console.error("[CRON SkugrRefill] Fatal error:", details);
        }
    }, null, true, "Europe/Kyiv");
    console.log("[CRON SkugrRefill] Started: weekly on Sunday at 22:00 (Kyiv time)");
    return job;
}
