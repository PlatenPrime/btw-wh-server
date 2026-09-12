import type { CheerioAPI } from "cheerio";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import {
  crawlHtmlGroupListingPages,
  getNextPageUrlFromLinkRelNext,
  mergeSearchParamsFromSource,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import {
  getSvbumGroupPagesProductsSchema,
  type GetSvbumGroupPagesProductsInput,
} from "./getSvbumGroupPagesProductsSchema.js";
import {
  parseSvbumGroupListingProducts,
  type SvbumGroupPageProduct,
} from "./parseSvbumGroupListingProducts.js";

export type { SvbumGroupPageProduct };

const SVBUM_FORWARD_LABEL = "Вперед";

function parseProductsFromPage(
  $: CheerioAPI,
  currentPageUrl: string
): Map<string, SvbumGroupPageProduct> {
  return parseSvbumGroupListingProducts($, currentPageUrl);
}

/**
 * Следующая страница: `link[rel=next]`, иначе `.pagination` «Вперед»
 * (класс `paination-text` — опечатка вёрстки сайта).
 */
export function getSvbumNextPageUrl(
  $: CheerioAPI,
  currentPageUrl: string
): string | null {
  const fromRel = getNextPageUrlFromLinkRelNext(
    $,
    currentPageUrl,
    resolveHrefAgainstBase
  );
  if (fromRel) {
    return fromRel;
  }

  let next: string | null = null;
  $(".pagination .paination-text a").each((_, el) => {
    if (next) {
      return;
    }
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text !== SVBUM_FORWARD_LABEL) {
      return;
    }
    const href = $(el).attr("href")?.trim();
    if (!href) {
      return;
    }
    next = resolveHrefAgainstBase(href, currentPageUrl);
  });
  return next;
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
