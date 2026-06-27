import { CronJob } from "cron";
import { createLogger } from "../logging/createLogger.js";
import {
  formatFillPosNameukrErrorReport,
  formatFillPosNameukrReport,
} from "./analytics-notifications/formatCronReports.js";
import { fillPosNameukrFromArtsUtil } from "./utils/fillPosNameukrFromArtsUtil.js";
import { sendMessageToPlaten } from "../utils/telegram/sendMessageToPlaten.js";

const log = createLogger({ module: "fill-pos-nameukr", job: "cron" });

/**
 * Запускает cron job для заполнения поля nameukr у позиций из справочника артикулов.
 * Каждый день в 06:30 по киевскому времени.
 */
export function startFillPosNameukrFromArtsCron(): CronJob {
  const job = new CronJob(
    "0 30 6 * * *",
    async () => {
      try {
        log.info("starting fill pos nameukr from arts");

        const result = await fillPosNameukrFromArtsUtil();

        log.info(
          {
            updatedCount: result.updatedCount,
            skippedArtikulsCount: result.skippedArtikulsCount,
          },
          "fill pos nameukr completed"
        );
        try {
          await sendMessageToPlaten(formatFillPosNameukrReport(result));
        } catch (notificationError) {
          log.error(
            { err: notificationError },
            "telegram notification failed after success"
          );
        }
      } catch (error) {
        log.error({ err: error }, "fill pos nameukr cron failed");
        try {
          await sendMessageToPlaten(formatFillPosNameukrErrorReport(error));
        } catch (notificationError) {
          log.error(
            { err: notificationError },
            "telegram notification failed after error"
          );
        }
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  log.info({ schedule: "0 30 6 * * *", timezone: "Europe/Kiev" }, "cron started");
  return job;
}
