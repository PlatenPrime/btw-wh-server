import { CronJob } from "cron";
import { formatAnalogSlicesReport } from "../../../cron/analytics-notifications/formatAnalogSlicesReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { ANALOG_SLICE_KONK_NAMES, calculateAnalogSlice, } from "../utils/calculateAnalogSlice.js";
import { getExcludedCompetitorSet, normalizeCompetitorName, } from "../../slices/config/excludedCompetitors.js";
const log = createLogger({ module: "analog-slices", job: "cron" });
/**
 * Запускает cron для ежедневных срезов аналогов (air, balun, sharte, yumi, yumin).
 * Ежедневно в 04:00 по киевскому времени. Все пять срезов считаются параллельно.
 */
export function startAnalogSlicesCron() {
    const job = new CronJob("0 0 4 * * *", async () => {
        try {
            const excluded = getExcludedCompetitorSet("analogSlices");
            const excludedList = ANALOG_SLICE_KONK_NAMES.filter((name) => excluded.has(normalizeCompetitorName(name)));
            const enabledKonkNames = ANALOG_SLICE_KONK_NAMES.filter((name) => !excluded.has(normalizeCompetitorName(name)));
            log.info({ enabledKonkNames }, "starting analog slices");
            if (excludedList.length > 0) {
                log.info({ excludedList }, "excluded competitors");
            }
            const results = await Promise.all(enabledKonkNames.map((konkName) => calculateAnalogSlice(konkName)));
            const competitors = enabledKonkNames.map((konkName, index) => {
                const r = results[index];
                return {
                    konkName,
                    count: r.count,
                    errors: r.errors,
                    invalid: r.invalid,
                    total: r.total,
                };
            });
            log.info({ competitors }, "analog slices completed");
            await sendCronAnalyticsReport(formatAnalogSlicesReport(competitors, excludedList));
        }
        catch (error) {
            log.error({ err: error }, "analog slices cron failed");
            await sendCronAnalyticsReport(formatCronErrorReport("Analog slices", error));
        }
    }, null, true, "Europe/Kiev");
    log.info({ schedule: "0 0 4 * * *", timezone: "Europe/Kiev" }, "cron started");
    return job;
}
