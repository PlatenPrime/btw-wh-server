import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, mergeSearchParamsFromSource, } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { getPerfectGroupPagesProductsSchema, } from "./getPerfectGroupPagesProductsSchema.js";
import { parsePerfectGroupListingProducts, } from "./parsePerfectGroupListingProducts.js";
function parseProductsFromPage($, currentPageUrl) {
    return parsePerfectGroupListingProducts($, currentPageUrl);
}
export async function getPerfectGroupPagesProducts(input) {
    const parseResult = getPerfectGroupPagesProductsSchema.safeParse(input);
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
