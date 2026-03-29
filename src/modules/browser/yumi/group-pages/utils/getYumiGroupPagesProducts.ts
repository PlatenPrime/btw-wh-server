import * as cheerio from "cheerio";
import {
  crawlHtmlGroupListingPages,
  getNextPageUrlFromLinkRelNext,
} from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import {
  getYumiGroupPagesProductsSchema,
  type GetYumiGroupPagesProductsInput,
} from "./getYumiGroupPagesProductsSchema.js";

export type YumiGroupPageProduct = {
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

/**
 * Декодит HTML-entities вида:
 * - `&#34;`, `&#39;` и т.п. (decimal/hex numeric)
 * - `&quot;`, `&amp;`, `&lt;`, `&gt;`, `&nbsp;`
 */
function decodeHtmlEntities(input: string): string {
  // numeric entities: &#34; / &#x22;
  const numericDecoded = input.replace(
    /&#(x?[0-9a-fA-F]+);/g,
    (_match, rawCode: string) => {
      const code = rawCode.startsWith("x") || rawCode.startsWith("X") ? rawCode.slice(1) : rawCode;
      const base = rawCode.startsWith("x") || rawCode.startsWith("X") ? 16 : 10;
      const codePoint = Number.parseInt(code, base);
      if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return _match;
      }
      return String.fromCodePoint(codePoint);
    }
  );

  return numericDecoded
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function parseProductsFromPage(
  $: cheerio.Root,
  currentPageUrl: string
): Map<string, YumiGroupPageProduct> {
  const result = new Map<string, YumiGroupPageProduct>();

  $(
    'button[data-qaid="buy-button"][data-product-id]'
  ).each((_, el) => {
    const $el = $(el);
    const productId = $el.attr("data-product-id")?.trim();
    const rawTitle = $el.attr("data-product-name")?.trim();
    const rawUrl = $el.attr("data-product-url")?.trim();
    const imageUrl = $el.attr("data-product-big-picture")?.trim();

    if (!productId || !rawTitle || !rawUrl || !imageUrl) {
      return;
    }

    const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
    const url = resolveUrl(rawUrl, currentPageUrl);

    if (!title || !url) {
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

export async function getYumiGroupPagesProducts(
  input: GetYumiGroupPagesProductsInput
): Promise<YumiGroupPageProduct[]> {
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

