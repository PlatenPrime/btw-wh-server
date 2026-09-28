import type { CheerioAPI } from "cheerio";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  crawlHtmlGroupListingPages,
  mergeSearchParamsFromSource,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import {
  getSvbumGroupPagesProductsSchema,
  type GetSvbumGroupPagesProductsInput,
} from "./getSvbumGroupPagesProductsSchema.js";
import {
  parseSvbumGroupListingProducts,
  type SvbumGroupPageProduct,
} from "./parseSvbumGroupListingProducts.js";
import { getSvbumNextPageUrl } from "./get-svbum-next-page-url/getSvbumNextPageUrl.js";

export type { SvbumGroupPageProduct };
export { getSvbumNextPageUrl } from "./get-svbum-next-page-url/getSvbumNextPageUrl.js";

function parseProductsFromPage(
  $: CheerioAPI,
  currentPageUrl: string
): Map<string, SvbumGroupPageProduct> {
  return parseSvbumGroupListingProducts($, currentPageUrl);
}

export async function getSvbumGroupPagesProducts(
  input: GetSvbumGroupPagesProductsInput
): Promise<SvbumGroupPageProduct[]> {
  const parseResult = getSvbumGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;

  return crawlHtmlGroupListingPages({
    startUrl: groupUrl,
    maxPages,
    parseProductsFromPage,
    getNextPageUrl: ($, url) => {
      const next = getSvbumNextPageUrl($, url);
      if (!next) {
        return null;
      }
      return mergeSearchParamsFromSource(next, groupUrl);
    },
    stopOnEmptyPage: true,
    delayBeforeNextMs: () => getGroupPagesThrottleDelayMs("svbum"),
    getHtml: (url) => fetchPageHtml(url, { konkName: "svbum" }),
  });
}
