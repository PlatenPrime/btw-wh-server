import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import { browserGet } from "../../../utils/browserRequest.js";
import { getAirHttpProxyUrl } from "../../utils/getAirHttpProxyUrl.js";
import { getAirGroupPagesProductsSchema, } from "./getAirGroupPagesProductsSchema.js";
const LAZY_IMAGE_MARKER = "lazy-image.svg";
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
        return resolveHrefAgainstBase(src, baseUrl);
    }
    if (dataSrcset) {
        const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
        if (firstPart) {
            const resolved = resolveHrefAgainstBase(firstPart, baseUrl);
            if (resolved) {
                return resolved;
            }
        }
    }
    if (src) {
        return resolveHrefAgainstBase(src, baseUrl);
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
        const url = resolveHrefAgainstBase(href, currentPageUrl);
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
        getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolveHrefAgainstBase),
        stopOnEmptyPage: true,
        delayBeforeNextMs: getGroupPagesThrottleDelayMs,
        fetchPageHtml: (url) => browserGet(url, { proxyUrl: getAirHttpProxyUrl() }),
    });
}
