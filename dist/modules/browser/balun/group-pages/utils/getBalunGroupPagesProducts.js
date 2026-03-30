import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, mergeSearchParamsFromSource, } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { parsePromUaGroupListingProducts } from "../../../group-pages/utils/parsePromUaGroupListingProducts.js";
import { getBalunGroupPagesProductsSchema, } from "./getBalunGroupPagesProductsSchema.js";
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
function parseProductsFromPage($, currentPageUrl) {
    return parsePromUaGroupListingProducts($, currentPageUrl);
}
export async function getBalunGroupPagesProducts(input) {
    const parseResult = getBalunGroupPagesProductsSchema.safeParse(input);
    if (!parseResult.success) {
        throw new Error(parseResult.error.message);
    }
    const { groupUrl, maxPages = 100 } = parseResult.data;
    return crawlHtmlGroupListingPages({
        startUrl: groupUrl,
        maxPages,
        parseProductsFromPage,
        getNextPageUrl: ($, url) => {
            const next = getNextPageUrlFromLinkRelNext($, url, resolveUrl);
            if (!next) {
                return null;
            }
            return mergeSearchParamsFromSource(next, groupUrl);
        },
    });
}
