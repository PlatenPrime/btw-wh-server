import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatSkuSlicesReport } from "../../../cron/analytics-notifications/formatSkuSlicesReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { toNextKyivSliceDate } from "../../../utils/sliceDate.js";
import { Sku } from "../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../utils/runSkuSliceForKonkUtil.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";

/**
 * Ежедневно в 20:00 по Киеву: параллельно срез по каждому konkName, для которого есть SKU.
 * Ключ дня среза — следующий календарный день в Киеве (как при старом запуске в полночь).
 */
export function startSkuSlicesCron(): CronJob {
  const job = new CronJob(
    "0 0 20 * * *",
    async () => {
      try {
        const names = await Sku.distinct("konkName");
        const excluded = getExcludedCompetitorSet("skuSlices");
        const uniqueNormalized = new Set<string>();
        const konkNames = names
          .map((n) => (typeof n === "string" ? n.trim() : ""))
          .filter((name) => name.length > 0)
          .filter((name) => {
            const normalized = normalizeCompetitorName(name);
            if (excluded.has(normalized) || uniqueNormalized.has(normalized)) {
              return false;
            }
            uniqueNormalized.add(normalized);
            return true;
          });
        const excludedFromData = names
          .map((n) => (typeof n === "string" ? n.trim() : ""))
          .filter((name) => name.length > 0)
          .filter((name) => excluded.has(normalizeCompetitorName(name)));

        console.log(`[CRON SkuSlices] Starting for ${konkNames.length} competitors...`);
        if (excludedFromData.length > 0) {
          console.log(
            `[CRON SkuSlices] Excluded competitors: ${excludedFromData.join(", ")}`
          );
        }
        const results = await Promise.all(
          konkNames.map(async (k) => {
            const r = await runSkuSliceForKonkUtil(
              k,
              toNextKyivSliceDate(new Date())
            );
            return {
              konkName: k,
              count: r.count,
              errors: r.errors,
              invalid: r.invalid,
              total: r.total,
            };
          })
        );
        const summary = results.map((r) => `${r.konkName}=${r.count}`).join(" ");
        console.log(`[CRON SkuSlices] Done: ${summary}`);
        await sendCronAnalyticsReport(
          formatSkuSlicesReport(results, excludedFromData)
        );
      } catch (error) {
        console.error(
          `[CRON SkuSlices] Error:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        await sendCronAnalyticsReport(formatCronErrorReport("SKU slices", error));
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  console.log(`[CRON SkuSlices] Started: daily at 20:00 (Kiev time)`);
  return job;
}
