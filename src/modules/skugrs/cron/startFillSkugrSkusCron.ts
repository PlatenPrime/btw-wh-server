import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatFillSkugrSkusReport } from "../../../cron/analytics-notifications/formatFillSkugrSkusReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { summarizeBrowserError } from "../../browser/utils/browserRequest.js";
import { Skugr } from "../models/Skugr.js";
import { fillSkugrSkusFromBrowserUtil } from "../utils/fillSkugrSkusFromBrowserUtil.js";

const log = createLogger({ module: "skugrs", job: "cron" });

/**
 * Еженедельно в воскресенье в 22:00 по Киеву:
 * последовательно перезаполняет SKU для всех skugr-групп.
 */
export function startFillSkugrSkusCron(): CronJob {
  const job = new CronJob(
    "0 0 22 * * 0",
    async () => {
      try {
        const skugrs = await Skugr.find().select("_id").lean().exec();
        log.info({ groupCount: skugrs.length }, "starting skugr refill");

        if (skugrs.length === 0) {
          log.info("no skugr groups found, skipping");
          await sendCronAnalyticsReport(
            formatFillSkugrSkusReport({ successCount: 0, errorCount: 0, total: 0 })
          );
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const [index, skugr] of skugrs.entries()) {
          const skugrId = String(skugr._id);
          try {
            const result = await fillSkugrSkusFromBrowserUtil(skugrId);
            if (!result) {
              log.warn(
                { skugrId, index: index + 1, total: skugrs.length },
                "skugr group not found during refill"
              );
              continue;
            }
            successCount += 1;
            log.info(
              {
                skugrId,
                index: index + 1,
                total: skugrs.length,
                stats: result.stats,
              },
              "skugr refill group completed"
            );
          } catch (error) {
            errorCount += 1;
            log.error(
              {
                skugrId,
                index: index + 1,
                total: skugrs.length,
                details: summarizeBrowserError(error),
              },
              "skugr refill group failed"
            );
          }
        }

        log.info(
          { successCount, errorCount, total: skugrs.length },
          "skugr refill finished"
        );
        await sendCronAnalyticsReport(
          formatFillSkugrSkusReport({
            successCount,
            errorCount,
            total: skugrs.length,
          })
        );
      } catch (error) {
        log.error(
          { err: error, details: summarizeBrowserError(error) },
          "skugr refill fatal error"
        );
        await sendCronAnalyticsReport(
          formatCronErrorReport("Skugr refill", error)
        );
      }
    },
    null,
    true,
    "Europe/Kyiv"
  );

  log.info(
    { schedule: "0 0 22 * * 0", timezone: "Europe/Kyiv" },
    "cron started"
  );
  return job;
}
