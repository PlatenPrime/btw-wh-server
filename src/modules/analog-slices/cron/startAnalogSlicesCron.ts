import { CronJob } from "cron";
import { formatAnalogSlicesReport } from "../../../cron/analytics-notifications/formatAnalogSlicesReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import {
  ANALOG_SLICE_KONK_NAMES,
  calculateAnalogSlice,
} from "../utils/calculateAnalogSlice.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";

/**
 * Запускает cron для ежедневных срезов аналогов (air, balun, sharte, yumi, yumin).
 * Ежедневно в 04:00 по киевскому времени. Все пять срезов считаются параллельно.
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

        console.log(
          `[CRON AnalogSlices] Starting for: ${enabledKonkNames.join(", ") || "none"}`
        );
        if (excludedList.length > 0) {
          console.log(
            `[CRON AnalogSlices] Excluded competitors: ${excludedList.join(", ")}`
          );
        }

        const results = await Promise.all(
          enabledKonkNames.map((konkName) => calculateAnalogSlice(konkName))
        );
        const competitors = enabledKonkNames.map((konkName, index) => {
          const r = results[index]!;
          return {
            konkName,
            count: r.count,
            errors: r.errors,
            invalid: r.invalid,
            total: r.total,
          };
        });
        const summary = competitors
          .map((c) => `${c.konkName}=${c.count}`)
          .join(" ");
        console.log(
          `[CRON AnalogSlices] Done: ${summary || "no competitors to process"}`
        );

        await sendCronAnalyticsReport(
          formatAnalogSlicesReport(competitors, excludedList)
        );
      } catch (error) {
        console.error(
          `[CRON AnalogSlices] Error:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        await sendCronAnalyticsReport(
          formatCronErrorReport("Analog slices", error)
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  console.log(`[CRON AnalogSlices] Started: daily at 04:00 (Kiev time)`);
  return job;
}
