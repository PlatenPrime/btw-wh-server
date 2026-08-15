import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatGraboSkuSyncReport } from "../../../cron/analytics-notifications/formatGraboSkuSyncReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import {
  releaseGraboSkuSync,
  tryAcquireGraboSkuSync,
} from "./graboSkuSyncLock.js";
import { runGraboSkuSyncUtil } from "./runGraboSkuSyncUtil.js";

const log = createLogger({ module: "grabo-skus", job: "manual" });

/**
 * Разовый прогон среза каталога Grabo после mongoose.connect, без HTTP/JWT.
 */
export async function runManualGraboSkuSync(): Promise<void> {
  if (!tryAcquireGraboSkuSync()) {
    log.warn("grabo sku sync already running");
    return;
  }

  try {
    log.info("manual grabo sku sync started");
    const stats = await runGraboSkuSyncUtil();
    log.info(stats, "manual grabo sku sync done");
    await sendCronAnalyticsReport(formatGraboSkuSyncReport(stats));
  } catch (err) {
    log.error({ err }, "manual grabo sku sync failed");
    await sendCronAnalyticsReport(formatCronErrorReport("Grabo SKU sync", err));
  } finally {
    releaseGraboSkuSync();
  }
}
