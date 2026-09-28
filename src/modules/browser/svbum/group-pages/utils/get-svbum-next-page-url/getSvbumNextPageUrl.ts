import type { CheerioAPI } from "cheerio";
import {
  getNextPageUrlFromLinkRelNext,
} from "../../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { resolveHrefAgainstBase } from "../../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";

const SVBUM_FORWARD_LABEL = "Вперед";

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
