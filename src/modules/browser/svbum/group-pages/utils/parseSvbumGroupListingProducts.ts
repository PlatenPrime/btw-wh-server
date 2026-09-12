import * as cheerio from "cheerio";
import type { BrowserCheerio } from "../../../utils/cheerioTypes.js";
import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";

export type SvbumGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function pickImageUrl(
  $card: BrowserCheerio,
  currentPageUrl: string
): string | null {
  const $img = $card.find(".image img").first();
  const src = $img.attr("src")?.trim() ?? "";
  if (!src) {
    return null;
  }
  const resolved = resolveHrefAgainstBase(src, currentPageUrl);
  if (resolved) {
    return resolved;
  }
  return src.startsWith("http") ? src : null;
}

function pickTitle($card: BrowserCheerio): string {
  const fromLink = $card.find(".product-title a").first().text();
  const $img = $card.find(".image img").first();
  const raw =
    fromLink.trim() ||
    $img.attr("alt")?.trim() ||
    $img.attr("title")?.trim() ||
    "";
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}

/**
 * Листинг категории OpenCart (sviatobum.ua): карточки `li.product-layout .product-thumb`.
 * productId — `button[data-p_id]`, не класс `productNNNN`.
 */
export function parseSvbumGroupListingProducts(
  $: cheerio.CheerioAPI,
  currentPageUrl: string
): Map<string, SvbumGroupPageProduct> {
  const result = new Map<string, SvbumGroupPageProduct>();

  $("li.product-layout .product-thumb").each((_, el) => {
    const $card = $(el);
    const productId = $card.find("button[data-p_id]").first().attr("data-p_id")?.trim() ?? "";
    if (!productId) {
      return;
    }

    const $link = $card.find(".product-title a").first();
    const href = $link.attr("href")?.trim() ?? "";
    const url = resolveHrefAgainstBase(href, currentPageUrl);
    if (!url) {
      return;
    }

    const title = pickTitle($card);
    if (!title) {
      return;
    }

    const imageUrl = pickImageUrl($card, currentPageUrl);
    if (!imageUrl) {
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
