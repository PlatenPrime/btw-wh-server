import { CronJob } from "cron";
import { runSkuInvalidFlagSync } from "../utils/runSkuInvalidFlagSync.js";

/**
 * Еженедельно в понедельник 03:00 по Киеву: пересчёт Sku.isInvalid по 7 дням срезов (-1/-1).
 */
export function startSkuInvalidFlagCron(): CronJob {
  const job = new CronJob(
    "0 0 3 * * 1",
    async () => {
      try {
        const r = await runSkuInvalidFlagSync(new Date());
        console.log(
          `[CRON SkuInvalid] Done: updatedSku=${r.updated}, konkCount=${r.konkCount}.`,
        );
      } catch (error) {
        console.error("[CRON SkuInvalid] Error:", error);
      }
    },
    null,
    true,
    "Europe/Kyiv",
  );

  console.log(
    "[CRON SkuInvalid] Started: weekly Monday 03:00 (Kyiv time)",
  );
  return job;
}
