import { CronJob } from "cron";
import { calculateBtradeSlice } from "../utils/calculateBtradeSlice.js";

/**
 * Запускает cron для ежедневного среза Btrade (Sharik).
 * Ежедневно в 00:00 по Europe/Kiev (полночь календарного дня среза).
 */
export function startBtradeSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 0 * * *",
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

  console.log(`[CRON BtradeSlices] Started: daily at 00:00 (Europe/Kiev)`);
  return job;
}
