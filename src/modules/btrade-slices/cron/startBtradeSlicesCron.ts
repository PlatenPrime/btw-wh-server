import { CronJob } from "cron";
import { calculateBtradeSlice } from "../utils/calculateBtradeSlice.js";

/**
 * Запускает cron для ежедневного среза Btrade (Sharik).
 * Ежедневно в 04:00 по киевскому времени.
 */
export function startBtradeSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 4 * * *",
    async () => {
      try {
        console.log(`[CRON BtradeSlices] Starting...`);
        const result = await calculateBtradeSlice();
        console.log(`[CRON BtradeSlices] Done: ${result.count} items`);
      } catch (error) {
        console.error(
          `[CRON BtradeSlices] Error:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  console.log(`[CRON BtradeSlices] Started: daily at 04:00 (Kiev time)`);
  return job;
}
