import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";
import { sleep } from "../../utils/sleep.js";

export type ResolveListingHref = (href: string, baseUrl: string) => string | null;

/**
 * Следующая страница из `<link rel="next" href="...">` (как у air / balun / yumi).
 */
export function getNextPageUrlFromLinkRelNext(
  $: cheerio.Root,
  currentPageUrl: string,
  resolveUrl: ResolveListingHref
): string | null {
  const nextHref = $('link[rel="next"]').first().attr("href")?.trim();
  if (!nextHref) {
    return null;
  }
  return resolveUrl(nextHref, currentPageUrl);
}

export type CrawlHtmlGroupListingPagesOptions<T> = {
  startUrl: string;
  maxPages: number;
  parseProductsFromPage: (
    $: cheerio.Root,
    pageUrl: string
  ) => Map<string, T>;
  getNextPageUrl: ($: cheerio.Root, pageUrl: string) => string | null;
  /** Прервать обход, если парсер вернул пустую страницу (air, sharte). */
  stopOnEmptyPage?: boolean;
  /** Пауза перед запросом следующей страницы (air). */
  delayBeforeNextMs?: number;
};

/**
 * Общий цикл: visited, maxPages, browserGet + cheerio, merge в Map, переход по next URL.
 */
export async function crawlHtmlGroupListingPages<T>(
  options: CrawlHtmlGroupListingPagesOptions<T>
): Promise<T[]> {
  const {
    startUrl,
    maxPages,
    parseProductsFromPage,
    getNextPageUrl,
    stopOnEmptyPage = false,
    delayBeforeNextMs = 0,
  } = options;

  const visited = new Set<string>();
  const products = new Map<string, T>();

  let currentUrl: string | null = startUrl;
  let fetchedPages = 0;

  while (currentUrl) {
    if (fetchedPages >= maxPages) {
      break;
    }

    if (visited.has(currentUrl)) {
      break;
    }
    visited.add(currentUrl);

    const html = await browserGet<string>(currentUrl);
    const $ = cheerio.load(html);

    const pageProducts = parseProductsFromPage($, currentUrl);
    if (stopOnEmptyPage && pageProducts.size === 0) {
      break;
    }

    for (const [id, product] of pageProducts) {
      products.set(id, product);
    }

    const nextUrl = getNextPageUrl($, currentUrl);
    if (!nextUrl || nextUrl === currentUrl || visited.has(nextUrl)) {
      break;
    }

    if (delayBeforeNextMs > 0) {
      await sleep(delayBeforeNextMs);
    }
    currentUrl = nextUrl;
    fetchedPages += 1;
  }

  return [...products.values()];
}
