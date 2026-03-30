import * as cheerio from "cheerio";
import {
  crawlHtmlGroupListingPages,
  getNextPageUrlFromLinkRelNext,
  mergeSearchParamsFromSource,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import { parsePromUaGroupListingProducts } from "../../../group-pages/utils/parsePromUaGroupListingProducts.js";
import {
  getBalunGroupPagesProductsSchema,
  type GetBalunGroupPagesProductsInput,
} from "./getBalunGroupPagesProductsSchema.js";

export type BalunGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function resolveUrl(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function parseProductsFromPage(
  $: cheerio.Root,
  currentPageUrl: string
): Map<string, BalunGroupPageProduct> {
  return parsePromUaGroupListingProducts($, currentPageUrl);
}

export async function getBalunGroupPagesProducts(
  input: GetBalunGroupPagesProductsInput
): Promise<BalunGroupPageProduct[]> {
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
