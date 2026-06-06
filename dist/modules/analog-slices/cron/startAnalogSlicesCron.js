import { CronJob } from "cron";
import { formatAnalogSlicesReport } from "../../../cron/analytics-notifications/formatAnalogSlicesReport.js";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { calculateAirSlice } from "../utils/calculateAirSlice.js";
import { calculateBalunSlice } from "../utils/calculateBalunSlice.js";
import { calculateSharteSlice } from "../utils/calculateSharteSlice.js";
import { calculateYumiSlice } from "../utils/calculateYumiSlice.js";
import { calculateYuminSlice } from "../utils/calculateYuminSlice.js";
import { getExcludedCompetitorSet, normalizeCompetitorName, } from "../../slices/config/excludedCompetitors.js";
/**
 * Запускает cron для ежедневных срезов аналогов (air, balun, sharte, yumi, yumin).
 * Ежедневно в 04:00 по киевскому времени. Все пять срезов считаются параллельно.
 */
export function startAnalogSlicesCron() {
    const job = new CronJob("0 0 4 * * *", async () => {
        try {
            const tasks = [
                { konkName: "air", run: calculateAirSlice },
                { konkName: "balun", run: calculateBalunSlice },
                { konkName: "sharte", run: calculateSharteSlice },
                { konkName: "yumi", run: calculateYumiSlice },
                { konkName: "yumin", run: calculateYuminSlice },
            ];
            const excluded = getExcludedCompetitorSet("analogSlices");
            const excludedList = tasks
                .map((task) => task.konkName)
                .filter((name) => excluded.has(normalizeCompetitorName(name)));
            const enabledTasks = tasks.filter((task) => !excluded.has(normalizeCompetitorName(task.konkName)));
            console.log(`[CRON AnalogSlices] Starting for: ${enabledTasks
                .map((task) => task.konkName)
                .join(", ") || "none"}`);
            if (excludedList.length > 0) {
                console.log(`[CRON AnalogSlices] Excluded competitors: ${excludedList.join(", ")}`);
            }
            const results = await Promise.all(enabledTasks.map((task) => task.run()));
            const competitors = enabledTasks.map((task, index) => {
                const r = results[index];
                return {
                    konkName: task.konkName,
                    count: r.count,
                    errors: r.errors,
                    invalid: r.invalid,
                    total: r.total,
                };
            });
            const summary = competitors
                .map((c) => `${c.konkName}=${c.count}`)
                .join(" ");
            console.log(`[CRON AnalogSlices] Done: ${summary || "no competitors to process"}`);
            await sendCronAnalyticsReport(formatAnalogSlicesReport(competitors, excludedList));
        }
        catch (error) {
            console.error(`[CRON AnalogSlices] Error:`, error instanceof Error ? error.message : "Unknown error");
            await sendCronAnalyticsReport(formatCronErrorReport("Analog slices", error));
        }
    }, null, true, "Europe/Kiev");
    console.log(`[CRON AnalogSlices] Started: daily at 04:00 (Kiev time)`);
    return job;
}
