import type { CheerioAPI } from "cheerio";
import { getNextPageUrlFromLinkRelNext } from "../../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { resolveHrefAgainstBase } from "../../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";

/**
 * Следующая страница листинга partymall.ua: `link[rel=next]`.
 * 404 / отсутствие next → null.
 */
export function getPartymallNextPageUrl($: CheerioAPI, currentPageUrl: string): string | null {
  if ($(".error-404-wrapper").length > 0) {
    return null;
  }
  return getNextPageUrlFromLinkRelNext($, currentPageUrl, resolveHrefAgainstBase);
}
