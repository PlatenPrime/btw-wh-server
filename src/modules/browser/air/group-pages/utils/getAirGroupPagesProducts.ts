import * as cheerio from "cheerio";
import type { BrowserCheerio } from "../../../utils/cheerioTypes.js";
import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import {
  crawlHtmlGroupListingPages,
  getNextPageUrlFromLinkRelNext,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { createLogger } from "../../../../../logging/createLogger.js";
import { isOriginBlockedError } from "../../../utils/browserOriginBlockedError.js";
import { getAirHttpProxyUrl } from "../../utils/getAirHttpProxyUrl.js";
import { resolveAirWarmUpUrl } from "../../utils/getAirStockData.js";
import {
  getAirGroupPagesProductsSchema,
  type GetAirGroupPagesProductsInput,
} from "./getAirGroupPagesProductsSchema.js";

export type AirGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

const LAZY_IMAGE_MARKER = "lazy-image.svg";
const airLog = createLogger({ module: "browser" });

function pickProductCards($: cheerio.CheerioAPI): BrowserCheerio {
  const fromGrid = $(".us-category-products div.product-layout[data-pid]");
  if (fromGrid.length > 0) {
    return fromGrid;
  }
  return $("#content div.product-layout[data-pid]");
}

function extractImageUrl($img: BrowserCheerio, baseUrl: string): string | null {
  const src = $img.attr("src")?.trim();
  const dataSrcset = $img.attr("data-srcset")?.trim();

  if (src && !src.includes(LAZY_IMAGE_MARKER)) {
    return resolveHrefAgainstBase(src, baseUrl);
  }

  if (dataSrcset) {
    const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
    if (firstPart) {
      const resolved = resolveHrefAgainstBase(firstPart, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (src) {
    return resolveHrefAgainstBase(src, baseUrl);
  }

  return null;
}

function parseProductsFromPage(
  $: cheerio.CheerioAPI,
  currentPageUrl: string
): Map<string, AirGroupPageProduct> {
  const result = new Map<string, AirGroupPageProduct>();

  pickProductCards($).each((_, el) => {
    const $card = $(el);
    const productId = $card.attr("data-pid")?.trim();
    if (!productId) {
      return;
    }

    const $img = $card.find(".us-module-img img").first();
    const imageUrl = $img.length ? extractImageUrl($img, currentPageUrl) : null;

    const $titleLink = $card.find(".us-module-title a").first();
    const rawTitle = $titleLink.text().trim();
    const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();

    const $imgLink = $card.find(".us-module-img a").first();
    const href =
      $imgLink.attr("href")?.trim() ?? $titleLink.attr("href")?.trim() ?? "";
    const url = resolveHrefAgainstBase(href, currentPageUrl);

    if (!title || !url || !imageUrl) {
      return;
    }

    result.set(productId, {
      productId,
      title,
      url,
      imageUrl,
    });
  });

  return result;
}

function airListingFetchOptions(warmUpUrl: string | undefined) {
  const proxyUrl = getAirHttpProxyUrl();
  return {
    konkName: "air" as const,
    transport: "impit" as const,
    proxyUrl,
    ...(warmUpUrl
      ? {
          headers: {
            Referer: warmUpUrl,
            "Sec-Fetch-Site": "same-origin",
          },
        }
      : {}),
  };
}

/**
 * Crawl HTML-листинга air (категория): Impit + cookie jar + adm.tools solver.
 * Один origin warm-up до пагинации; listing pages без повторного warmUpUrl.
 */
export async function getAirGroupPagesProducts(
  input: GetAirGroupPagesProductsInput
): Promise<AirGroupPageProduct[]> {
  const parseResult = getAirGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;
  const warmUpUrl = resolveAirWarmUpUrl(groupUrl);
  const listingOpts = airListingFetchOptions(warmUpUrl);

  if (warmUpUrl) {
    try {
      await fetchPageHtml(warmUpUrl, listingOpts);
    } catch (warmErr) {
      if (isOriginBlockedError(warmErr)) {
        throw warmErr;
      }
      airLog.warn(
        {
          context: "Air group listing warm-up failed, continue crawl",
          url: warmUpUrl,
          groupUrl,
          details:
            warmErr instanceof Error ? warmErr.message : String(warmErr),
        },
        "air group warmup failed"
      );
    }
  }

  return crawlHtmlGroupListingPages({
    startUrl: groupUrl,
    maxPages,
    parseProductsFromPage,
    getNextPageUrl: ($, url) =>
      getNextPageUrlFromLinkRelNext($, url, resolveHrefAgainstBase),
    stopOnEmptyPage: true,
    delayBeforeNextMs: () => getGroupPagesThrottleDelayMs("air"),
    getHtml: (url) => fetchPageHtml(url, listingOpts),
  });
}
