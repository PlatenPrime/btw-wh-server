import * as cheerio from "cheerio";
import { crawlHtmlGroupListingPages } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";
import {
  getSharteGroupPagesProductsSchema,
  type GetSharteGroupPagesProductsInput,
} from "./getSharteGroupPagesProductsSchema.js";

export type SharteGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

const LAZY_IMAGE_MARKER = "lazy-image.svg";

function resolveUrl(href: string, baseUrl: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#") {
    return null;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(input: string): string {
  const numericDecoded = input.replace(
    /&#(x?[0-9a-fA-F]+);/g,
    (_match, rawCode: string) => {
      const code =
        rawCode.startsWith("x") || rawCode.startsWith("X")
          ? rawCode.slice(1)
          : rawCode;
      const base =
        rawCode.startsWith("x") || rawCode.startsWith("X") ? 16 : 10;
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

function extractImageUrl($img: cheerio.Cheerio, baseUrl: string): string | null {
  const src = $img.attr("src")?.trim();
  const dataSrcset = $img.attr("data-srcset")?.trim();

  if (src && !src.includes(LAZY_IMAGE_MARKER)) {
    return resolveUrl(src, baseUrl);
  }

  if (dataSrcset) {
    const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
    if (firstPart) {
      const resolved = resolveUrl(firstPart, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (src) {
    return resolveUrl(src, baseUrl);
  }

  return null;
}

function pickProductHref(
  $card: cheerio.Cheerio,
  currentPageUrl: string
): string | null {
  const pictureHref = $card.find("a.picture").first().attr("href")?.trim();
  if (pictureHref && pictureHref !== "#") {
    const u = resolveUrl(pictureHref, currentPageUrl);
    if (u) {
      return u;
    }
  }

  const nameHref = $card.find("a.name").first().attr("href")?.trim();
  if (nameHref && nameHref !== "#") {
    return resolveUrl(nameHref, currentPageUrl);
  }

  return null;
}

function parseProductsFromPage(
  $: cheerio.Root,
  currentPageUrl: string
): Map<string, SharteGroupPageProduct> {
  const result = new Map<string, SharteGroupPageProduct>();

  $(".items.productList .item.product.sku[data-product-id]").each((_, el) => {
    const $card = $(el);
    const productId = $card.attr("data-product-id")?.trim();
    if (!productId) {
      return;
    }

    const $img = $card.find("a.picture img").first();
    const imageUrl = $img.length ? extractImageUrl($img, currentPageUrl) : null;

    const rawTitle =
      $card.find("a.name .middle").first().text().trim() ||
      $img.attr("alt")?.trim() ||
      "";
    const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();

    const url = pickProductHref($card, currentPageUrl);

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

function getNextPageUrl($: cheerio.Root, currentPageUrl: string): string | null {
  const nextFromPagination = $(".bx-pagination li.bx-pag-next a")
    .first()
    .attr("href")
    ?.trim();
  if (nextFromPagination) {
    return resolveUrl(nextFromPagination, currentPageUrl);
  }

  const nextHref = $('link[rel="next"]').first().attr("href")?.trim();
  if (nextHref) {
    return resolveUrl(nextHref, currentPageUrl);
  }

  return null;
}

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
    parseProductsFromPage,
    getNextPageUrl,
    stopOnEmptyPage: true,
  });
}
