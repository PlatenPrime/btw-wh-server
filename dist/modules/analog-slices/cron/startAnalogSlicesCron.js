import { CronJob } from "cron";
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
            const summary = enabledTasks
                .map((task, index) => `${task.konkName}=${results[index]?.count ?? 0}`)
                .join(" ");
            console.log(`[CRON AnalogSlices] Done: ${summary || "no competitors to process"}`);
        }
        catch (error) {
            console.error(`[CRON AnalogSlices] Error:`, error instanceof Error ? error.message : "Unknown error");
        }
    }, null, true, "Europe/Kiev");
    console.log(`[CRON AnalogSlices] Started: daily at 04:00 (Kiev time)`);
    return job;
}
