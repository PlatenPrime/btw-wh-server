import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { parsePromUaGroupListingProducts } from "../../../group-pages/utils/parsePromUaGroupListingProducts.js";
import { getYumiGroupPagesProductsSchema, } from "./getYumiGroupPagesProductsSchema.js";
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
export async function getYumiGroupPagesProducts(input) {
    const parseResult = getYumiGroupPagesProductsSchema.safeParse(input);
    if (!parseResult.success) {
        // В контроллерах это обычно превращается в 400,
        // а тут — корректный error, чтобы вызывающая сторона решила сама.
        throw new Error(parseResult.error.message);
    }
    const { groupUrl, maxPages = 100 } = parseResult.data;
    return crawlHtmlGroupListingPages({
        startUrl: groupUrl,
        maxPages,
        parseProductsFromPage,
        getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolveUrl),
    });
}
