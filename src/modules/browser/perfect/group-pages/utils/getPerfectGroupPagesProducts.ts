import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  crawlHtmlGroupListingPages,
  getNextPageUrlFromLinkRelNext,
  mergeSearchParamsFromSource,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import {
  getPerfectGroupPagesProductsSchema,
  type GetPerfectGroupPagesProductsInput,
} from "./getPerfectGroupPagesProductsSchema.js";
import {
  parsePerfectGroupListingProducts,
  type PerfectGroupPageProduct,
} from "./parsePerfectGroupListingProducts.js";

export type { PerfectGroupPageProduct };

function parseProductsFromPage(
  $: cheerio.Root,
  currentPageUrl: string,
): Map<string, PerfectGroupPageProduct> {
  return parsePerfectGroupListingProducts($, currentPageUrl);
}

export async function getPerfectGroupPagesProducts(
  input: GetPerfectGroupPagesProductsInput,
): Promise<PerfectGroupPageProduct[]> {
  const parseResult = getPerfectGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;

  return crawlHtmlGroupListingPages({
    startUrl: groupUrl,
    maxPages,
    parseProductsFromPage,
    getNextPageUrl: ($, url) => {
      const next = getNextPageUrlFromLinkRelNext(
        $,
        url,
        resolveHrefAgainstBase,
      );
      if (!next) {
        return null;
      }
      return mergeSearchParamsFromSource(next, groupUrl);
    },
    delayBeforeNextMs: getGroupPagesThrottleDelayMs,
  });
}