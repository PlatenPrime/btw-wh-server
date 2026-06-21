import { CronJob } from "cron";
import { formatBtradeSliceReport } from "../../../cron/analytics-notifications/formatBtradeSliceReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { calculateBtradeSlice } from "../utils/calculateBtradeSlice.js";

const log = createLogger({ module: "btrade-slices", job: "cron" });

/**
 * Запускает cron для ежедневного среза Btrade (Sharik).
 * Ежедневно в 00:00 по Europe/Kiev (полночь календарного дня среза).
 */
export function startBtradeSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 0 * * *",
    async () => {
      try {
        log.info("starting btrade slice");
        const result = await calculateBtradeSlice();
        log.info({ count: result.count }, "btrade slice completed");
        await sendCronAnalyticsReport(formatBtradeSliceReport(result));
      } catch (error) {
        log.error({ err: error }, "btrade slice cron failed");
        await sendCronAnalyticsReport(
          formatCronErrorReport("Btrade slice", error)
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  log.info({ schedule: "0 0 0 * * *", timezone: "Europe/Kiev" }, "cron started");
  return job;
}
