import { CronJob } from "cron";
import { formatCronErrorReport } from "../../../cron/analytics-notifications/formatCronReports.js";
import { formatFillSkugrSkusReport } from "../../../cron/analytics-notifications/formatFillSkugrSkusReport.js";
import { sendCronAnalyticsReport } from "../../../cron/analytics-notifications/sendCronAnalyticsReport.js";
import { createLogger } from "../../../logging/createLogger.js";
import { isOriginBlockedError } from "../../browser/utils/browserOriginBlockedError.js";
import { summarizeBrowserError } from "../../browser/utils/browserRequest.js";
import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import {
  resolveInterUnitClusterPauseMs,
  resolveInterUnitDelayMs,
  shouldApplyInterUnitClusterPause,
} from "../../slices/utils/competitorScrapeThrottle.js";
import { delay } from "../../../utils/delay.js";
import { isServerSkugrFillDisabled } from "../config/isServerSkugrFillDisabled.js";
import { Skugr } from "../models/Skugr.js";
import { fillSkugrSkusFromBrowserUtil } from "../utils/fillSkugrSkusFromBrowserUtil.js";

const log = createLogger({ module: "skugrs", job: "cron" });

type SkugrCronRow = {
  _id: { toString(): string };
  konkName?: string;
};

async function delayBetweenSkugrGroups(args: {
  konkName: string;
  completedUnits: number;
  isLast: boolean;
}): Promise<void> {
  const interUnitMs = resolveInterUnitDelayMs(args.konkName, "groupPagesFill");
  if (interUnitMs != null && interUnitMs > 0) {
    await delay(interUnitMs);
  }

  if (
    shouldApplyInterUnitClusterPause({
      konkName: args.konkName,
      completedUnits: args.completedUnits,
      isLast: args.isLast,
      runKind: "groupPagesFill",
    })
  ) {
    const clusterMs = resolveInterUnitClusterPauseMs(
      args.konkName,
      "groupPagesFill"
    );
    if (clusterMs != null && clusterMs > 0) {
      log.info(
        {
          konkName: args.konkName,
          completedUnits: args.completedUnits,
          pauseMs: clusterMs,
          pauseKind: "cluster",
        },
        "skugr refill inter-group cluster pause"
      );
      await delay(clusterMs);
    }
  }
}

/**
 * Еженедельно в воскресенье в 22:00 по Киеву:
 * последовательно перезаполняет SKU для всех skugr-групп.
 */
export function startFillSkugrSkusCron(): CronJob {
  const job = new CronJob(
    "0 0 22 * * 0",
    async () => {
      try {
        const skugrs = (await Skugr.find()
          .select("_id konkName")
          .lean()
          .exec()) as SkugrCronRow[];
        log.info({ groupCount: skugrs.length }, "starting skugr refill");

        if (skugrs.length === 0) {
          log.info("no skugr groups found, skipping");
          await sendCronAnalyticsReport(
            formatFillSkugrSkusReport({ successCount: 0, errorCount: 0, total: 0 })
          );
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        let airOriginBlocked = false;

        for (const [index, skugr] of skugrs.entries()) {
          const skugrId = String(skugr._id);
          const konkName = (skugr.konkName ?? "").trim();
          const normalizedKonk = normalizeCompetitorName(konkName);
          const isLast = index >= skugrs.length - 1;

          if (isServerSkugrFillDisabled(konkName)) {
            log.info(
              { skugrId, konkName, index: index + 1, total: skugrs.length },
              "skugr refill skipped (server fill disabled)"
            );
            continue;
          }

          if (airOriginBlocked && normalizedKonk === "air") {
            log.warn(
              { skugrId, index: index + 1, total: skugrs.length },
              "skugr refill air group skipped after origin block"
            );
            continue;
          }

          try {
            const result = await fillSkugrSkusFromBrowserUtil(skugrId);
            if (!result) {
              log.warn(
                { skugrId, index: index + 1, total: skugrs.length },
                "skugr group not found during refill"
              );
              continue;
            }
            successCount += 1;
            log.info(
              {
                skugrId,
                konkName,
                index: index + 1,
                total: skugrs.length,
                stats: result.stats,
              },
              "skugr refill group completed"
            );
          } catch (error) {
            errorCount += 1;
            log.error(
              {
                skugrId,
                konkName,
                index: index + 1,
                total: skugrs.length,
                details: summarizeBrowserError(error),
              },
              "skugr refill group failed"
            );

            if (isOriginBlockedError(error) && normalizedKonk === "air") {
              airOriginBlocked = true;
              log.error(
                { konkName, skugrId },
                "skugr refill air groups aborted after origin block"
              );
            }
          }

          if (!isLast && konkName.length > 0) {
            if (airOriginBlocked && normalizedKonk === "air") {
              continue;
            }
            await delayBetweenSkugrGroups({
              konkName,
              completedUnits: index + 1,
              isLast,
            });
          }
        }

        log.info(
          { successCount, errorCount, total: skugrs.length, airOriginBlocked },
          "skugr refill finished"
        );
        await sendCronAnalyticsReport(
          formatFillSkugrSkusReport({
            successCount,
            errorCount,
            total: skugrs.length,
          })
        );
      } catch (error) {
        log.error(
          { err: error, details: summarizeBrowserError(error) },
          "skugr refill fatal error"
        );
        await sendCronAnalyticsReport(
          formatCronErrorReport("Skugr refill", error)
        );
      }
    },
    null,
    true,
    "Europe/Kyiv"
  );

  log.info(
    { schedule: "0 0 22 * * 0", timezone: "Europe/Kyiv" },
    "cron started"
  );
  return job;
}
