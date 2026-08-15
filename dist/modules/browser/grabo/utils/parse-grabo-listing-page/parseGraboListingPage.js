import * as cheerio from "cheerio";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
/** Карточка товара Grabo: `/en/{code}-balloon-...` */
const GRABO_PRODUCT_PATH_RE = /\/en\/[^/?#]+-balloon-/i;
/**
 * URL карточки товара (не категория и не filter `?tag1=`).
 */
export function isGraboProductPageUrl(url) {
    try {
        return GRABO_PRODUCT_PATH_RE.test(new URL(url).pathname);
    }
    catch {
        return false;
    }
}
/**
 * Следующая страница только по `nav.archive-links.pages a[rel="next"]`.
 * `rel="last"` на Grabo врёт (page-16 при реальной last page-17) — не используем.
 */
export function getGraboListingNextPageUrl($, pageUrl) {
    const href = $('nav.archive-links.pages a[rel="next"]')
        .first()
        .attr("href")
        ?.trim();
    if (!href) {
        return null;
    }
    return resolveHrefAgainstBase(href, pageUrl);
}
export function parseGraboListingProducts($, pageUrl) {
    const result = new Map();
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
export function parseGraboListingPage(html, pageUrl) {
    const $ = cheerio.load(html);
    const products = parseGraboListingProducts($, pageUrl);
    return {
        productUrls: [...products.keys()],
        nextPageUrl: getGraboListingNextPageUrl($, pageUrl),
    };
}
