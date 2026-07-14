import * as cheerio from "cheerio";
import type { BrowserCheerio } from "../../../utils/cheerioTypes.js";
import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { extractProductId } from "../../utils/perfect-product-page-extract/perfectProductPageExtract.js";

export type PerfectGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function pickImageUrl(
  $img: BrowserCheerio,
  currentPageUrl: string
): string | null {
  const full =
    $img.attr("data-full-size-image-url")?.trim() ??
    $img.attr("data-lzl-src")?.trim() ??
    $img.attr("src")?.trim() ??
    "";
  if (!full) return null;
  const resolved = resolveHrefAgainstBase(full, currentPageUrl);
  if (resolved) return resolved;
  return full.startsWith("http") ? full : null;
}

/**
 * Листинг категории PrestaShop (perfectparty.in.ua): карточки
 * `article.product-miniature.js-product-miniature`.
 */
export function parsePerfectGroupListingProducts(
  $: cheerio.CheerioAPI,
  currentPageUrl: string
): Map<string, PerfectGroupPageProduct> {
  const result = new Map<string, PerfectGroupPageProduct>();

  $(
    "article.product-miniature.js-product-miniature[data-id-product]"
  ).each((_, el) => {
    const $card = $(el);
    const $link = $card.find("a.thumbnail.product-thumbnail").first();
    const href = $link.attr("href")?.trim() ?? "";
    const url = resolveHrefAgainstBase(href, currentPageUrl);
    if (!url) return;

    const productId = extractProductId("{}", url)?.trim() ?? "";
    if (!productId) return;

    const $img = $link.find("img").first();
    const rawTitle =
      $img.attr("alt")?.trim() ||
      $img.attr("title")?.trim() ||
      "";
    const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
    if (!title) return;

    const imageUrl = pickImageUrl($img, currentPageUrl);
    if (!imageUrl) return;

    result.set(productId, {
      productId,
      title,
      url,
      imageUrl,
    });
  });

  return result;
}
