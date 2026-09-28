import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
import { crawlHtmlGroupListingPages } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import {
  getSharteGroupPagesProductsSchema,
  type GetSharteGroupPagesProductsInput,
} from "./getSharteGroupPagesProductsSchema.js";
import {
  getSharteGroupNextPageUrl,
  parseSharteGroupListingProducts,
  type SharteGroupPageProduct,
} from "./parse-sharte-group-listing/parseSharteGroupListingProducts.js";

export type { SharteGroupPageProduct };

export async function getSharteGroupPagesProducts(
  input: GetSharteGroupPagesProductsInput
): Promise<SharteGroupPageProduct[]> {
  const parseResult = getSharteGroupPagesProductsSchema.safeParse(input);
  if (!parseResult.success) {
    throw new Error(parseResult.error.message);
  }

  const { groupUrl, maxPages = 100 } = parseResult.data;

  return crawlHtmlGroupListingPages({
    startUrl: groupUrl,
    maxPages,
    parseProductsFromPage: parseSharteGroupListingProducts,
    getNextPageUrl: getSharteGroupNextPageUrl,
    stopOnEmptyPage: true,
    delayBeforeNextMs: getGroupPagesThrottleDelayMs,
  });
}
