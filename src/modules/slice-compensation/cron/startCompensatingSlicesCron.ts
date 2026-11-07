import { CronJob } from "cron";
import { formatCompensatingSlicesReport } from "../../../cron/analytics-notifications/formatCompensatingSlicesReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { runCompensatingSkuSlices } from "../utils/runCompensatingSkuSlices.js";

const log = createLogger({ module: "slice-compensation", job: "cron" });

/**
 * Компенсирующие срезы: ежедневно в 10:30 Europe/Kiev — повторный опрос позиций
 * с недостоверными данными в сегодняшних SkuSliceMonth.
 */
export function startCompensatingSlicesCron(): CronJob {
  const job = new CronJob(
    "0 30 10 * * *",
    async () => {
      try {
        const sliceDate = toSliceDate(new Date());
        const sliceDateLabel = sliceDate.toISOString().slice(0, 10);
        log.info({ sliceDateLabel }, "starting compensating slices");
        const sku = await runCompensatingSkuSlices(sliceDate);
        log.info({ sku }, "compensating slices completed");
        await sendCronAnalyticsReport(
          formatCompensatingSlicesReport({
            sliceDateLabel,
            sku,
          }),
        );
      } catch (error) {
        log.error({ err: error }, "compensating slices cron failed");
        await sendCronAnalyticsReport(formatCronErrorReport("Compensating slices", error));
      }
    },
    null,
    true,
    "Europe/Kiev",
  );

  log.info({ schedule: "0 30 10 * * *", timezone: "Europe/Kiev" }, "cron started");
  return job;
}
