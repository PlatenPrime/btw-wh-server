import * as cheerio from "cheerio";
import type { BrowserCheerio } from "../../../utils/cheerioTypes.js";
import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";

export type PartymallGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

function pickImageUrl($card: BrowserCheerio, currentPageUrl: string): string | null {
  const $img = $card.find(".ds-module-img-box img").first();
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
  const fromLink = $card.find("a.ds-module-title").first().text();
  const $img = $card.find(".ds-module-img-box img").first();
  const raw = fromLink.trim() || $img.attr("alt")?.trim() || $img.attr("title")?.trim() || "";
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}

/**
 * Листинг категории partymall.ua: карточки в `.ds-category-products`.
 * `data-pid="0000"` — заголовок таблицы, пропускаем. 404 → пустая Map.
 */
export function parsePartymallGroupListingProducts(
  $: cheerio.CheerioAPI,
  currentPageUrl: string,
): Map<string, PartymallGroupPageProduct> {
  const result = new Map<string, PartymallGroupPageProduct>();

  if ($(".error-404-wrapper").length > 0) {
    return result;
  }

  $(".ds-category-products .ds-module-item[data-pid]").each((_, el) => {
    const $card = $(el);
    const productId = $card.attr("data-pid")?.trim() ?? "";
    if (!productId || productId === "0000") {
      return;
    }

    const $link = $card.find("a.ds-module-title").first();
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
