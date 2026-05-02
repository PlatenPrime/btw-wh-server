import * as cheerio from "cheerio";
import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { getGroupPagesThrottleDelayMs } from "../../../group-pages/config/groupPagesThrottle.js";
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

function extractImageUrl(
  $img: cheerio.Cheerio,
  baseUrl: string,
): string | null {
  const src = $img.attr("src")?.trim();
  const dataSrcset = $img.attr("data-srcset")?.trim();

  if (src && !src.includes(LAZY_IMAGE_MARKER)) {
    return resolveHrefAgainstBase(src, baseUrl);
  }

  if (dataSrcset) {
    const firstPart = dataSrcset.split(/\s+/)[0]?.trim();
    if (firstPart) {
      const resolved = resolveHrefAgainstBase(firstPart, baseUrl);
      if (resolved) {
        return resolved;
      }
    }
  }

  if (src) {
    return resolveHrefAgainstBase(src, baseUrl);
  }

  return null;
}

function pickProductHref(
  $card: cheerio.Cheerio,
  currentPageUrl: string,
): string | null {
  const pictureHref = $card.find("a.picture").first().attr("href")?.trim();
  if (pictureHref && pictureHref !== "#") {
    const u = resolveHrefAgainstBase(pictureHref, currentPageUrl);
    if (u) {
      return u;
    }
  }

  const nameHref = $card.find("a.name").first().attr("href")?.trim();
  if (nameHref && nameHref !== "#") {
    return resolveHrefAgainstBase(nameHref, currentPageUrl);
  }

  return null;
}

function parseProductsFromPage(
  $: cheerio.Root,
  currentPageUrl: string,
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

function getNextPageUrl(
  $: cheerio.Root,
  currentPageUrl: string,
): string | null {
  const nextFromPagination = $(".bx-pagination li.bx-pag-next a")
    .first()
    .attr("href")
    ?.trim();
  if (nextFromPagination) {
    return resolveHrefAgainstBase(nextFromPagination, currentPageUrl);
  }

  const nextHref = $('link[rel="next"]').first().attr("href")?.trim();
  if (nextHref) {
    return resolveHrefAgainstBase(nextHref, currentPageUrl);
  }

  return null;
}

export async function getSharteGroupPagesProducts(
  input: GetSharteGroupPagesProductsInput,
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
    delayBeforeNextMs: getGroupPagesThrottleDelayMs,
  });
}
