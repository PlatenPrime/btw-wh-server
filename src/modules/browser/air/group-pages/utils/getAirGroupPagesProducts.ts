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
import { AIR_IDLE_MODE } from "../../utils/airIdleMode.js";
import { AirServerIdleError } from "../../utils/airServerIdleError.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import {
  parseAirGroupListingProductsMap,
  type AirGroupPageProduct,
} from "./parseAirGroupListingPage.js";
import {
  getAirGroupPagesProductsSchema,
  type GetAirGroupPagesProductsInput,
} from "./getAirGroupPagesProductsSchema.js";

export type { AirGroupPageProduct } from "./parseAirGroupListingPage.js";

const airLog = createLogger({ module: "browser" });

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
 * При AIR_IDLE_MODE сеть не трогает.
 */
export async function getAirGroupPagesProducts(
  input: GetAirGroupPagesProductsInput
): Promise<AirGroupPageProduct[]> {
  if (AIR_IDLE_MODE) {
    throw new AirServerIdleError();
  }

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
    parseProductsFromPage: parseAirGroupListingProductsMap,
    getNextPageUrl: ($, url) =>
      getNextPageUrlFromLinkRelNext($, url, resolveHrefAgainstBase),
    stopOnEmptyPage: true,
    delayBeforeNextMs: () => getGroupPagesThrottleDelayMs("air"),
    getHtml: (url) => fetchPageHtml(url, listingOpts),
  });
}
