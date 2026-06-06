import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatSkuInvalidFlagReport } from "../../../cron/analytics-notifications/formatSkuInvalidFlagReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { runSkuInvalidFlagSync } from "../utils/runSkuInvalidFlagSync.js";

/**
 * Еженедельно в понедельник 03:00 по Киеву: пересчёт Sku.isInvalid по 7 дням срезов (-1/-1).
 */
export function startSkuInvalidFlagCron(): CronJob {
  const job = new CronJob(
    "0 0 3 * * 1",
    async () => {
      try {
        const r = await runSkuInvalidFlagSync(new Date());
        console.log(
          `[CRON SkuInvalid] Done: updatedSku=${r.updated}, konkCount=${r.konkCount}.`,
        );
        await sendCronAnalyticsReport(formatSkuInvalidFlagReport(r));
      } catch (error) {
        console.error("[CRON SkuInvalid] Error:", error);
        await sendCronAnalyticsReport(
          formatCronErrorReport("Sku invalid flag sync", error)
        );
      }
    },
    null,
    true,
    "Europe/Kyiv",
  );

  console.log(
    "[CRON SkuInvalid] Started: weekly Monday 03:00 (Kyiv time)",
  );
  return job;
}
