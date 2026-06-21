import { CronJob } from "cron";
import { createLogger } from "../../../logging/createLogger.js";
import { calculateAndSavePogrebiDefsUtil } from "../controllers/calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js";

const log = createLogger({ module: "defs", job: "cron" });

/**
 * Запускает cron job для автоматического расчета дефицитов
 * По будням каждый час с 09:00 до 17:00 по киевскому времени
 */
export function startDeficitCalculationCron(): CronJob {
  const job = new CronJob(
    "0 0 8-17 * * 1-5", // будни 09:00-17:00
    async () => {
      try {
        log.info("calculating deficits");
        const result = await calculateAndSavePogrebiDefsUtil();
        log.info({ total: result.total }, "deficit calculation completed");
      } catch (error) {
        log.error({ err: error }, "deficit calculation cron failed");
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  log.info(
    { schedule: "0 0 8-17 * * 1-5", timezone: "Europe/Kiev" },
    "cron started"
  );
  return job;
}
