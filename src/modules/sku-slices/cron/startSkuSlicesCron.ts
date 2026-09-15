import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatPerfectPackFlipReport } from "../../../cron/analytics-notifications/formatPerfectPackFlipReport.js";
import {
  formatSkuKonkSliceReport,
  formatSkuSlicesExcludedReport,
} from "../../../cron/analytics-notifications/formatSkuSlicesReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { toNextKyivSliceDate } from "../../../utils/sliceDate.js";
import { Sku } from "../../skus/models/Sku.js";
import { runSkuSliceForKonkUtil } from "../utils/runSkuSliceForKonkUtil.js";
import {
  packFlipReviewDatesForSliceDay,
  reviewPerfectPackFlipsUtil,
} from "../utils/reviewPerfectPackFlipsUtil.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";

const log = createLogger({ module: "sku-slices", job: "cron" });

async function reviewPerfectPackFlipsAfterSlices(sliceDate: Date): Promise<void> {
  try {
    const review = await reviewPerfectPackFlipsUtil({
      dates: packFlipReviewDatesForSliceDay(sliceDate),
      apply: true,
    });
    await sendCronAnalyticsReport(formatPerfectPackFlipReport(review));
  } catch (reviewError) {
    log.error({ err: reviewError }, "perfect pack-flip review failed");
    await sendCronAnalyticsReport(
      formatCronErrorReport("Perfect pack-flip review", reviewError)
    );
  }
}

/**
 * Ежедневно в 20:00 по Киеву: параллельно срез по каждому konkName, для которого есть SKU.
 * Ключ дня среза — следующий календарный день в Киеве (как при старом запуске в полночь).
 * TG: отдельное сообщение после каждого konk (+ excluded в начале, если есть).
 * После всех срезов — pack-flip review Perfect (3 дня, авто-рескейл инверсий).
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

        log.info({ konkCount: konkNames.length }, "starting sku slices");
        if (excludedFromData.length > 0) {
          log.info(
            { excludedCompetitors: excludedFromData },
            "excluded competitors"
          );
          await sendCronAnalyticsReport(
            formatSkuSlicesExcludedReport(excludedFromData)
          );
        }

        const sliceDate = toNextKyivSliceDate(new Date());
        const results = await Promise.all(
          konkNames.map(async (k) => {
            const r = await runSkuSliceForKonkUtil(k, sliceDate);
            const stats = {
              konkName: k,
              count: r.count,
              errors: r.errors,
              invalid: r.invalid,
              total: r.total,
              ...(r.abortReason ? { abortReason: r.abortReason } : {}),
            };
            await sendCronAnalyticsReport(formatSkuKonkSliceReport(stats));
            return stats;
          })
        );
        log.info({ results }, "sku slices completed");
        await reviewPerfectPackFlipsAfterSlices(sliceDate);
      } catch (error) {
        log.error({ err: error }, "sku slices cron failed");
        await sendCronAnalyticsReport(formatCronErrorReport("SKU slices", error));
      }
    },
    null,
    true,
    "Europe/Kiev"
  );

  log.info({ schedule: "0 0 20 * * *", timezone: "Europe/Kiev" }, "cron started");
  return job;
}
