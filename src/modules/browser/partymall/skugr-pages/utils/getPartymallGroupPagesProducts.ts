import type { CheerioAPI } from "cheerio";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  crawlHtmlGroupListingPages,
  mergeSearchParamsFromSource,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import {
  getPartymallGroupPagesProductsSchema,
  type GetPartymallGroupPagesProductsInput,
} from "./getPartymallGroupPagesProductsSchema.js";
import {
  parsePartymallGroupListingProducts,
  type PartymallGroupPageProduct,
} from "./parsePartymallGroupListingProducts.js";
import { getPartymallNextPageUrl } from "./get-partymall-next-page-url/getPartymallNextPageUrl.js";

export type { PartymallGroupPageProduct };
export { getPartymallNextPageUrl } from "./get-partymall-next-page-url/getPartymallNextPageUrl.js";

function parseProductsFromPage(
  $: CheerioAPI,
  currentPageUrl: string,
): Map<string, PartymallGroupPageProduct> {
  return parsePartymallGroupListingProducts($, currentPageUrl);
}

export async function getPartymallGroupPagesProducts(
  input: GetPartymallGroupPagesProductsInput,
): Promise<PartymallGroupPageProduct[]> {
  const parseResult = getPartymallGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;

  return crawlHtmlGroupListingPages({
    startUrl: groupUrl,
    maxPages,
    parseProductsFromPage,
    getNextPageUrl: ($, url) => {
      const next = getPartymallNextPageUrl($, url);
      if (!next) {
        return null;
      }
      return mergeSearchParamsFromSource(next, groupUrl);
    },
    stopOnEmptyPage: true,
    delayBeforeNextMs: () => getGroupPagesThrottleDelayMs("partymall"),
    getHtml: (url) => fetchPageHtml(url, { konkName: "partymall" }),
  });
}
