import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";
import { sleep } from "../../utils/sleep.js";
/**
 * Следующая страница из `<link rel="next" href="...">` (как у air / balun / yumi).
 */
export function getNextPageUrlFromLinkRelNext($, currentPageUrl, resolveUrl) {
    const nextHref = $('link[rel="next"]').first().attr("href")?.trim();
    if (!nextHref) {
        return null;
    }
    return resolveUrl(nextHref, currentPageUrl);
}
/**
 * Общий цикл: visited, maxPages, browserGet + cheerio, merge в Map, переход по next URL.
 */
export async function crawlHtmlGroupListingPages(options) {
    const { startUrl, maxPages, parseProductsFromPage, getNextPageUrl, stopOnEmptyPage = false, delayBeforeNextMs = 0, } = options;
    const visited = new Set();
    const products = new Map();
    let currentUrl = startUrl;
    let fetchedPages = 0;
    while (currentUrl) {
        if (fetchedPages >= maxPages) {
            break;
        }
        if (visited.has(currentUrl)) {
            break;
        }
        visited.add(currentUrl);
        const html = await browserGet(currentUrl);
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
