import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import { getAirGroupPagesProductsSchema, } from "./getAirGroupPagesProductsSchema.js";
const LAZY_IMAGE_MARKER = "lazy-image.svg";
function resolveUrl(href, baseUrl) {
    const trimmed = href.trim();
    if (!trimmed) {
        return null;
    }
    try {
        return new URL(trimmed, baseUrl).toString();
    }
    catch {
        return null;
    }
}
function decodeHtmlEntities(input) {
    const numericDecoded = input.replace(/&#(x?[0-9a-fA-F]+);/g, (_match, rawCode) => {
        const code = rawCode.startsWith("x") || rawCode.startsWith("X")
            ? rawCode.slice(1)
            : rawCode;
        const base = rawCode.startsWith("x") || rawCode.startsWith("X") ? 16 : 10;
        const codePoint = Number.parseInt(code, base);
        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
            return _match;
        }
        return String.fromCodePoint(codePoint);
    });
    return numericDecoded
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}
function pickProductCards($) {
    const fromGrid = $(".us-category-products div.product-layout[data-pid]");
    if (fromGrid.length > 0) {
        return fromGrid;
    }
    return $("#content div.product-layout[data-pid]");
}
function extractImageUrl($img, baseUrl) {
    const src = $img.attr("src")?.trim();
    const dataSrcset = $img.attr("data-srcset")?.trim();
    if (src && !src.includes(LAZY_IMAGE_MARKER)) {
        return resolveUrl(src, baseUrl);
    }
    if (dataSrcset) {
        const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
        if (firstPart) {
            const resolved = resolveUrl(firstPart, baseUrl);
            if (resolved) {
                return resolved;
            }
        }
    }
    if (src) {
        return resolveUrl(src, baseUrl);
    }
    return null;
}
function parseProductsFromPage($, currentPageUrl) {
    const result = new Map();
    pickProductCards($).each((_, el) => {
        const $card = $(el);
        const productId = $card.attr("data-pid")?.trim();
        if (!productId) {
            return;
        }
        const $img = $card.find(".us-module-img img").first();
        const imageUrl = $img.length ? extractImageUrl($img, currentPageUrl) : null;
        const $titleLink = $card.find(".us-module-title a").first();
        const rawTitle = $titleLink.text().trim();
        const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
        const $imgLink = $card.find(".us-module-img a").first();
        const href = $imgLink.attr("href")?.trim() ?? $titleLink.attr("href")?.trim() ?? "";
        const url = resolveUrl(href, currentPageUrl);
        if (!title || !url || !imageUrl) {
            return;
        }
        result.set(productId, {
            productId,
            title,
            url,
            imageUrl,
        });
    });
    return result;
}
export async function getAirGroupPagesProducts(input) {
    const parseResult = getAirGroupPagesProductsSchema.safeParse(input);
    if (!parseResult.success) {
        throw new Error(parseResult.error.message);
    }
    const { groupUrl, maxPages = 100 } = parseResult.data;
    return crawlHtmlGroupListingPages({
        startUrl: groupUrl,
        maxPages,
        parseProductsFromPage,
        getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolveUrl),
        stopOnEmptyPage: true,
        delayBeforeNextMs: getGroupPagesThrottleDelayMs,
    });
}
