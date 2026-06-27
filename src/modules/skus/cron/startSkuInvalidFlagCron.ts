import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatSkuInvalidFlagReport } from "../../../cron/analytics-notifications/formatSkuInvalidFlagReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { runSkuInvalidFlagSync } from "../utils/runSkuInvalidFlagSync.js";

const log = createLogger({ module: "skus", job: "cron" });

/**
 * Еженедельно в воскресенье 14:00 по Киеву: пересчёт Sku.isInvalid по 7 дням срезов (-1/-1).
 */
export function startSkuInvalidFlagCron(): CronJob {
  const job = new CronJob(
    "0 0 14 * * 0",
    async () => {
      try {
        const r = await runSkuInvalidFlagSync(new Date());
        log.info(
          { updatedSku: r.updated, konkCount: r.konkCount },
          "sku invalid flag sync completed"
        );
        await sendCronAnalyticsReport(formatSkuInvalidFlagReport(r));
      } catch (error) {
        log.error({ err: error }, "sku invalid flag cron failed");
        await sendCronAnalyticsReport(
          formatCronErrorReport("Sku invalid flag sync", error)
        );
      }
    },
    null,
    true,
    "Europe/Kyiv",
  );

  log.info(
    { schedule: "0 0 14 * * 0", timezone: "Europe/Kyiv" },
    "cron started"
  );
  return job;
}
