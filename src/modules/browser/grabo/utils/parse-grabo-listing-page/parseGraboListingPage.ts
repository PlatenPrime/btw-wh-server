import * as cheerio from "cheerio";
import type { BrowserCheerioAPI } from "../../../utils/cheerioTypes.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";

/** Карточка товара Grabo: `/en/{code}-balloon-...` */
const GRABO_PRODUCT_PATH_RE = /\/en\/[^/?#]+-balloon-/i;

export type GraboListingProduct = {
  url: string;
};

export type GraboListingPageParse = {
  productUrls: string[];
  nextPageUrl: string | null;
};

/**
 * URL карточки товара (не категория и не filter `?tag1=`).
 */
export function isGraboProductPageUrl(url: string): boolean {
  try {
    return GRABO_PRODUCT_PATH_RE.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

/**
 * Следующая страница только по `nav.archive-links.pages a[rel="next"]`.
 * `rel="last"` на Grabo врёт (page-16 при реальной last page-17) — не используем.
 */
export function getGraboListingNextPageUrl(
  $: BrowserCheerioAPI,
  pageUrl: string
): string | null {
  const href = $('nav.archive-links.pages a[rel="next"]')
    .first()
    .attr("href")
    ?.trim();
  if (!href) {
    return null;
  }
  return resolveHrefAgainstBase(href, pageUrl);
}

export function parseGraboListingProducts(
  $: BrowserCheerioAPI,
  pageUrl: string
): Map<string, GraboListingProduct> {
  const result = new Map<string, GraboListingProduct>();

  $("section.archive article.allclick h2.title a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) {
      return;
    }
    const absolute = resolveHrefAgainstBase(href, pageUrl);
    if (!absolute || !isGraboProductPageUrl(absolute)) {
      return;
    }
    result.set(absolute, { url: absolute });
  });

  return result;
}

/**
 * Чистый парсинг HTML листинга категории: URL товаров и next page.
 */
export function parseGraboListingPage(
  html: string,
  pageUrl: string
): GraboListingPageParse {
  const $ = cheerio.load(html);
  const products = parseGraboListingProducts($, pageUrl);
  return {
    productUrls: [...products.keys()],
    nextPageUrl: getGraboListingNextPageUrl($, pageUrl),
  };
}
