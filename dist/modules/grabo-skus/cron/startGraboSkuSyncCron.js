import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatGraboSkuSyncReport } from "../../../cron/analytics-notifications/formatGraboSkuSyncReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { releaseGraboSkuSync, tryAcquireGraboSkuSync, } from "../utils/graboSkuSyncLock.js";
import { runGraboSkuSyncUtil } from "../utils/runGraboSkuSyncUtil.js";
export const GRABO_SKU_SYNC_CRON_EXPR = "0 0 4 * * 6";
export const GRABO_SKU_SYNC_CRON_TZ = "Europe/Kyiv";
const log = createLogger({ module: "grabo-skus", job: "cron" });
/**
 * Еженедельно в субботу 04:00 по Киеву: полный срез каталога Grabo.
 */
export function startGraboSkuSyncCron() {
    const job = new CronJob(GRABO_SKU_SYNC_CRON_EXPR, async () => {
        if (!tryAcquireGraboSkuSync()) {
            log.warn("grabo sku sync already running, skip cron tick");
            return;
        }
        try {
            const stats = await runGraboSkuSyncUtil();
            log.info(stats, "grabo sku sync completed");
            await sendCronAnalyticsReport(formatGraboSkuSyncReport(stats));
        }
        catch (error) {
            log.error({ err: error }, "grabo sku sync cron failed");
            await sendCronAnalyticsReport(formatCronErrorReport("Grabo SKU sync", error));
        }
        finally {
            releaseGraboSkuSync();
        }
    }, null, true, GRABO_SKU_SYNC_CRON_TZ);
    log.info({ schedule: GRABO_SKU_SYNC_CRON_EXPR, timezone: GRABO_SKU_SYNC_CRON_TZ }, "cron started");
    return job;
}
