import { CronJob } from "cron";
import { Sku } from "../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../utils/runSkuSliceForKonkUtil.js";

/**
 * Ежедневно в 00:00 по Киеву: параллельно срез по каждому konkName, для которого есть SKU.
 */
export function startSkuSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 0 * * *",
    async () => {
      try {
        const names = await Sku.distinct("konkName");
        const konkNames = names
          .map((n) => (typeof n === "string" ? n.trim() : ""))
          .filter((n) => n.length > 0);

        console.log(`[CRON SkuSlices] Starting for ${konkNames.length} competitors...`);
        const results = await Promise.all(
          konkNames.map(async (k) => {
            const r = await runSkuSliceForKonkUtil(k, new Date());
            return { k, count: r.count };
          })
        );
        const summary = results.map((r) => `${r.k}=${r.count}`).join(" ");
        console.log(`[CRON SkuSlices] Done: ${summary}`);
      } catch (error) {
        console.error(
          `[CRON SkuSlices] Error:`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  console.log(`[CRON SkuSlices] Started: daily at 00:00 (Kiev time)`);
  return job;
}
