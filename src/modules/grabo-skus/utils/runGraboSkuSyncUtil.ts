import { collectGraboCatalogProductUrls } from "../../browser/grabo/utils/collect-grabo-catalog-urls/collectGraboCatalogProductUrls.js";
import { getGraboSkuData } from "../../browser/grabo/utils/get-grabo-sku-data/getGraboSkuData.js";
import type { GraboSkuData } from "../../browser/grabo/utils/types/graboSkuData.js";
import { sleep } from "../../browser/utils/sleep.js";
import { createLogger } from "../../../logging/createLogger.js";
import { getGraboSkuSyncJitterDelayMs } from "../constants/graboSkuSyncJitterMs.js";
import { markGraboSkusOffSiteUtil } from "./markGraboSkusOffSiteUtil.js";
import { upsertGraboSkuUtil } from "./upsertGraboSkuUtil.js";

const log = createLogger({ module: "grabo-skus" });

export type GraboSkuSyncStats = {
  categoryCount: number;
  listed: number;
  created: number;
  updated: number;
  skippedNoProductId: number;
  errors: number;
  markedOffSite: number;
  catalogComplete: boolean;
};

export type RunGraboSkuSyncDeps = {
  collectCatalog?: typeof collectGraboCatalogProductUrls;
  getSkuData?: (url: string) => Promise<GraboSkuData>;
  delayMs?: () => number;
  now?: () => Date;
};

async function delayIfNeeded(delayMs: () => number, isFirst: boolean) {
  if (isFirst) {
    return;
  }
  const ms = delayMs();
  if (ms > 0) {
    await sleep(ms);
  }
}

/**
 * Полный срез каталога Grabo: listing → PDP upsert по productId → absent-pass.
 */
export async function runGraboSkuSyncUtil(
  deps: RunGraboSkuSyncDeps = {}
): Promise<GraboSkuSyncStats> {
  const collectCatalog = deps.collectCatalog ?? collectGraboCatalogProductUrls;
  const getSkuData = deps.getSkuData ?? getGraboSkuData;
  const delayMs = deps.delayMs ?? getGraboSkuSyncJitterDelayMs;
  const now = deps.now ?? (() => new Date());

  log.info("grabo sku sync started");

  const catalog = await collectCatalog({
    delayBeforeNextMs: delayMs,
    delayBetweenCategoriesMs: delayMs,
  });

  const catalogComplete = catalog.failedCategoryUrls.length === 0;
  const stats: GraboSkuSyncStats = {
    categoryCount: catalog.categoryUrls.length,
    listed: catalog.productUrls.length,
    created: 0,
    updated: 0,
    skippedNoProductId: 0,
    errors: 0,
    markedOffSite: 0,
    catalogComplete,
  };

  log.info(
    {
      categoryCount: stats.categoryCount,
      listed: stats.listed,
      failedCategories: catalog.failedCategoryUrls.length,
      catalogComplete,
    },
    "grabo sku catalog collected"
  );

  for (let i = 0; i < catalog.productUrls.length; i++) {
    const url = catalog.productUrls[i]!;
    const index = i + 1;
    await delayIfNeeded(delayMs, i === 0);

    try {
      const data = await getSkuData(url);
      if (!data.productId.trim()) {
        stats.skippedNoProductId += 1;
        log.info(
          { index, total: stats.listed, url, result: "skipped-no-productId" },
          "grabo sku product"
        );
        continue;
      }
      const result = await upsertGraboSkuUtil(
        { ...data, productId: data.productId.trim(), url },
        now()
      );
      if (result === "created") {
        stats.created += 1;
      } else {
        stats.updated += 1;
      }
      log.info(
        {
          index,
          total: stats.listed,
          productId: data.productId.trim(),
          result,
          created: stats.created,
          updated: stats.updated,
          errors: stats.errors,
          url,
        },
        "grabo sku product"
      );
    } catch (error) {
      stats.errors += 1;
      log.warn(
        {
          index,
          total: stats.listed,
          url,
          errors: stats.errors,
          details: error instanceof Error ? error.message : String(error),
        },
        "grabo sku product fetch failed"
      );
    }
  }

  if (catalogComplete && catalog.productUrls.length > 0) {
    log.info({ listed: stats.listed }, "grabo sku absent-pass start");
    stats.markedOffSite = await markGraboSkusOffSiteUtil(catalog.productUrls);
    log.info(
      { markedOffSite: stats.markedOffSite },
      "grabo sku absent-pass done"
    );
  } else {
    log.info(
      { catalogComplete, listed: stats.listed },
      "grabo sku absent-pass skipped"
    );
  }

  log.info(stats, "grabo sku sync finished");
  return stats;
}
