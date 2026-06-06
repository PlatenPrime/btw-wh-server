import { CronJob } from "cron";
import { formatBtradeSliceReport } from "../../../cron/analytics-notifications/formatBtradeSliceReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { calculateBtradeSlice } from "../utils/calculateBtradeSlice.js";

/**
 * Запускает cron для ежедневного среза Btrade (Sharik).
 * Ежедневно в 00:00 по Europe/Kiev (полночь календарного дня среза).
 */
export function startBtradeSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 0 * * *",
    async () => {
      try {
        console.log(`[CRON BtradeSlices] Starting...`);
        const result = await calculateBtradeSlice();
        console.log(`[CRON BtradeSlices] Done: ${result.count} items`);
        await sendCronAnalyticsReport(formatBtradeSliceReport(result));
      } catch (error) {
        console.error(
          `[CRON BtradeSlices] Error:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        await sendCronAnalyticsReport(
          formatCronErrorReport("Btrade slice", error)
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  console.log(`[CRON BtradeSlices] Started: daily at 00:00 (Europe/Kiev)`);
  return job;
}
