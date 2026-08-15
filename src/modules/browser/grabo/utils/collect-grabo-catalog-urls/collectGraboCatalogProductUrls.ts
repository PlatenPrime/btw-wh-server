import { createLogger } from "../../../../../logging/createLogger.js";
import { sleep } from "../../../utils/sleep.js";
import { fetchGraboPageHtml } from "../fetch-grabo-page-html/fetchGraboPageHtml.js";
import { getGraboListingProducts } from "../get-grabo-listing-products/getGraboListingProducts.js";
import { parseGraboSitemapCategoryUrls } from "../parse-grabo-sitemap/parseGraboSitemapCategoryUrls.js";
import { GRABO_SITEMAP_URL } from "../types/graboSkuData.js";

const log = createLogger({ module: "browser", konk: "grabo" });

export type CollectGraboCatalogResult = {
  categoryUrls: string[];
  productUrls: string[];
  failedCategoryUrls: string[];
};

export type CollectGraboCatalogOptions = {
  delayBeforeNextMs?: number | (() => number);
  delayBetweenCategoriesMs?: number | (() => number);
  maxPages?: number;
  getHtml?: (url: string) => Promise<string>;
};

function resolveDelay(delay?: number | (() => number)): number {
  if (delay == null) {
    return 0;
  }
  return typeof delay === "function" ? delay() : delay;
}

/**
 * Sitemap → категории Products → уникальные URL карточек.
 * Ошибка sitemap пробрасывается. Ошибка одной категории — в failedCategoryUrls, остальные идут дальше.
 */
export async function collectGraboCatalogProductUrls(
  options?: CollectGraboCatalogOptions
): Promise<CollectGraboCatalogResult> {
  const getHtml = options?.getHtml ?? fetchGraboPageHtml;

  const sitemapHtml = await getHtml(GRABO_SITEMAP_URL);
  const categoryUrls = parseGraboSitemapCategoryUrls(sitemapHtml);
  log.info(
    { sitemapUrl: GRABO_SITEMAP_URL, categoryCount: categoryUrls.length },
    "grabo catalog sitemap parsed"
  );
  const productUrls = new Set<string>();
  const failedCategoryUrls: string[] = [];

  for (let i = 0; i < categoryUrls.length; i++) {
    if (i > 0) {
      const delayMs = resolveDelay(options?.delayBetweenCategoriesMs);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    const categoryUrl = categoryUrls[i]!;
    const index = i + 1;
    log.info(
      { index, total: categoryUrls.length, categoryUrl },
      "grabo catalog category start"
    );
    try {
      const urls = await getGraboListingProducts(
        {
          groupUrl: categoryUrl,
          ...(options?.maxPages !== undefined && { maxPages: options.maxPages }),
        },
        {
          delayBeforeNextMs: options?.delayBeforeNextMs,
          getHtml,
        }
      );
      for (const url of urls) {
        productUrls.add(url);
      }
      log.info(
        {
          index,
          total: categoryUrls.length,
          categoryUrl,
          listed: urls.length,
          uniqueTotal: productUrls.size,
        },
        "grabo catalog category done"
      );
    } catch (error) {
      failedCategoryUrls.push(categoryUrl);
      log.warn(
        {
          index,
          total: categoryUrls.length,
          categoryUrl,
          details: error instanceof Error ? error.message : String(error),
        },
        "grabo catalog category failed"
      );
    }
  }

  return {
    categoryUrls,
    productUrls: [...productUrls],
    failedCategoryUrls,
  };
}
