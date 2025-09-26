import { CronJob } from "cron";
import { calculateAndSavePogrebiDefs } from "../utils/calculatePogrebiDefs.js";

/**
 * Запускает cron job для автоматического расчета дефицитов
 * По будням каждый час с 09:00 до 17:00 по киевскому времени
 */
export function startDeficitCalculationCron(): CronJob {
  const job = new CronJob(
    "0 0 8-17 * * 1-5", // будни 09:00-17:00
    async () => {
      try {
        console.log(`[CRON] Calculating deficits...`);
        const result = await calculateAndSavePogrebiDefs();
        console.log(`[CRON] Completed: ${result.totalDeficits} deficits found`);
      } catch (error) {
        console.error(
          `[CRON] Error:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  console.log(`[CRON Defs] Started: weekdays 09:00-17:00 (Kiev time)`);
  return job;
}
