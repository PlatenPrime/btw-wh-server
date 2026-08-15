import { createLogger } from "../../../../../logging/createLogger.js";
import { crawlHtmlGroupListingPages } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { fetchGraboPageHtml } from "../fetch-grabo-page-html/fetchGraboPageHtml.js";
import {
  getGraboListingNextPageUrl,
  parseGraboListingProducts,
} from "../parse-grabo-listing-page/parseGraboListingPage.js";
import {
  GRABO_LISTING_DEFAULT_MAX_PAGES,
  getGraboListingProductsSchema,
  type GetGraboListingProductsInput,
} from "./getGraboListingProductsSchema.js";

const log = createLogger({ module: "browser", konk: "grabo" });

export type GetGraboListingProductsOptions = {
  delayBeforeNextMs?: number | (() => number);
  getHtml?: (url: string) => Promise<string>;
};

/**
 * Crawl пагинации одной категории Grabo. Next только `rel="next"`, не `rel="last"`.
 */
export async function getGraboListingProducts(
  input: GetGraboListingProductsInput,
  options?: GetGraboListingProductsOptions
): Promise<string[]> {
  const parseResult = getGraboListingProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = GRABO_LISTING_DEFAULT_MAX_PAGES } =
    parseResult.data;
  const innerGetHtml = options?.getHtml ?? fetchGraboPageHtml;

  let page = 0;
  const getHtml = async (url: string) => {
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

  log.info(
    { groupUrl, pages: page, listed: products.length },
    "grabo listing crawl done"
  );

  return products.map((product) => product.url);
}
