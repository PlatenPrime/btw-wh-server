import type { CheerioAPI } from "cheerio";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  crawlHtmlGroupListingPages,
  getNextPageUrlFromLinkRelNext,
  mergeSearchParamsFromSource,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { parsePromUaGroupListingProducts } from "../../../group-pages/utils/parsePromUaGroupListingProducts.js";
import {
  getDojdevikGroupPagesProductsSchema,
  type GetDojdevikGroupPagesProductsInput,
} from "./getDojdevikGroupPagesProductsSchema.js";

export type DojdevikGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function parseProductsFromPage(
  $: CheerioAPI,
  currentPageUrl: string
): Map<string, DojdevikGroupPageProduct> {
  return parsePromUaGroupListingProducts($, currentPageUrl);
}

export async function getDojdevikGroupPagesProducts(
  input: GetDojdevikGroupPagesProductsInput
): Promise<DojdevikGroupPageProduct[]> {
  const parseResult = getDojdevikGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;

  return crawlHtmlGroupListingPages({
    startUrl: groupUrl,
    maxPages,
    parseProductsFromPage,
    getNextPageUrl: ($, url) => {
      const next = getNextPageUrlFromLinkRelNext($, url, resolveHrefAgainstBase);
      if (!next) {
        return null;
      }
      return mergeSearchParamsFromSource(next, groupUrl);
    },
    delayBeforeNextMs: getGroupPagesThrottleDelayMs,
  });
}
