import type { CheerioAPI } from "cheerio";
import type { BrowserCheerio } from "../../../../utils/cheerioTypes.js";
import { decodeHtmlEntities } from "../../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { resolveLazyListingImage } from "../../../../utils/resolve-lazy-listing-image/resolveLazyListingImage.js";

export type SharteGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function pickProductHref(
  $card: BrowserCheerio,
  currentPageUrl: string
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

export function parseSharteGroupListingProducts(
  $: CheerioAPI,
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
    const imageUrl = $img.length
      ? resolveLazyListingImage($img, currentPageUrl)
      : null;

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

export function getSharteGroupNextPageUrl(
  $: CheerioAPI,
  currentPageUrl: string
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
