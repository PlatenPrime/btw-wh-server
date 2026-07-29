import { CronJob } from "cron";
import {
  formatAnalogKonkSliceReport,
  formatAnalogSlicesExcludedReport,
} from "../../../cron/analytics-notifications/formatAnalogSlicesReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import {
  ANALOG_SLICE_KONK_NAMES,
  calculateAnalogSlice,
} from "../utils/calculateAnalogSlice.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";

const log = createLogger({ module: "analog-slices", job: "cron" });

/**
 * Запускает cron для ежедневных срезов аналогов (air, balun, sharte, yumi, yumin).
 * Ежедневно в 04:00 по киевскому времени. Включённые срезы считаются параллельно.
 * TG: отдельное сообщение после каждого konk (+ excluded в начале, если есть).
 */
export function startAnalogSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 4 * * *",
    async () => {
      try {
        const excluded = getExcludedCompetitorSet("analogSlices");
        const excludedList = ANALOG_SLICE_KONK_NAMES.filter((name) =>
          excluded.has(normalizeCompetitorName(name))
        );
        const enabledKonkNames = ANALOG_SLICE_KONK_NAMES.filter(
          (name) => !excluded.has(normalizeCompetitorName(name))
        );

        log.info({ enabledKonkNames }, "starting analog slices");
        if (excludedList.length > 0) {
          log.info({ excludedList }, "excluded competitors");
          await sendCronAnalyticsReport(
            formatAnalogSlicesExcludedReport(excludedList)
          );
        }

        const results = await Promise.all(
          enabledKonkNames.map(async (konkName) => {
            const r = await calculateAnalogSlice(konkName);
            const stats = {
              konkName,
              count: r.count,
              errors: r.errors,
              invalid: r.invalid,
              total: r.total,
            };
            await sendCronAnalyticsReport(formatAnalogKonkSliceReport(stats));
            return stats;
          })
        );
        log.info({ competitors: results }, "analog slices completed");
      } catch (error) {
        log.error({ err: error }, "analog slices cron failed");
        await sendCronAnalyticsReport(
          formatCronErrorReport("Analog slices", error)
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  log.info({ schedule: "0 0 4 * * *", timezone: "Europe/Kiev" }, "cron started");
  return job;
}
