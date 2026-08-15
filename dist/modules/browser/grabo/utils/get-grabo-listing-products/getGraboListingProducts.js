import { createLogger } from "../../../../../logging/createLogger.js";
import { crawlHtmlGroupListingPages } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { fetchGraboPageHtml } from "../fetch-grabo-page-html/fetchGraboPageHtml.js";
import { getGraboListingNextPageUrl, parseGraboListingProducts, } from "../parse-grabo-listing-page/parseGraboListingPage.js";
import { GRABO_LISTING_DEFAULT_MAX_PAGES, getGraboListingProductsSchema, } from "./getGraboListingProductsSchema.js";
const log = createLogger({ module: "browser", konk: "grabo" });
/**
 * Crawl пагинации одной категории Grabo. Next только `rel="next"`, не `rel="last"`.
 */
export async function getGraboListingProducts(input, options) {
    const parseResult = getGraboListingProductsSchema.safeParse(input);
    if (!parseResult.success) {
        throw new Error(parseResult.error.message);
    }
    const { groupUrl, maxPages = GRABO_LISTING_DEFAULT_MAX_PAGES } = parseResult.data;
    const innerGetHtml = options?.getHtml ?? fetchGraboPageHtml;
    let page = 0;
    const getHtml = async (url) => {
        page += 1;
        log.info({ groupUrl, page, url }, "grabo listing page fetch");
        return innerGetHtml(url);
    };
    const products = await crawlHtmlGroupListingPages({
        startUrl: groupUrl,
        maxPages,
        parseProductsFromPage: parseGraboListingProducts,
        getNextPageUrl: getGraboListingNextPageUrl,
        stopOnEmptyPage: true,
        delayBeforeNextMs: options?.delayBeforeNextMs ?? 0,
        getHtml,
    });
    log.info({ groupUrl, pages: page, listed: products.length }, "grabo listing crawl done");
    return products.map((product) => product.url);
}
