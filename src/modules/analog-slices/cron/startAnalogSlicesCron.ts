import { CronJob } from "cron";
import { calculateAirSlice } from "../utils/calculateAirSlice.js";
import { calculateBalunSlice } from "../utils/calculateBalunSlice.js";
import { calculateSharteSlice } from "../utils/calculateSharteSlice.js";
import { calculateYumiSlice } from "../utils/calculateYumiSlice.js";

/**
 * Запускает cron для ежедневных срезов аналогов (air, balun, sharte, yumi).
 * Ежедневно в 04:00 по киевскому времени. Все четыре среза считаются параллельно.
 */
export function startAnalogSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 4 * * *",
    async () => {
      try {
        console.log(`[CRON AnalogSlices] Starting all slices...`);
        const [air, balun, sharte, yumi] = await Promise.all([
          calculateAirSlice(),
          calculateBalunSlice(),
          calculateSharteSlice(),
          calculateYumiSlice(),
        ]);
        console.log(
          `[CRON AnalogSlices] Done: air=${air.count} balun=${balun.count} sharte=${sharte.count} yumi=${yumi.count}`
        );
      } catch (error) {
        console.error(
          `[CRON AnalogSlices] Error:`,
          error instanceof Error ? error.message : "Unknown error"
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
