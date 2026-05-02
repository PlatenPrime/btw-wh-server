import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, mergeSearchParamsFromSource, } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import { parsePromUaGroupListingProducts } from "../../../group-pages/utils/parsePromUaGroupListingProducts.js";
import { getBalunGroupPagesProductsSchema, } from "./getBalunGroupPagesProductsSchema.js";
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
            const next = getNextPageUrlFromLinkRelNext($, url, resolveHrefAgainstBase);
            if (!next) {
                return null;
            }
            return mergeSearchParamsFromSource(next, groupUrl);
        },
        delayBeforeNextMs: getGroupPagesThrottleDelayMs,
    });
}
