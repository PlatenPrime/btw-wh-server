import * as cheerio from "cheerio";

export type PromUaGroupPageProduct = {
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

/**
 * Листинг группы Prom.ua (Balun, Yumi и т.п.): в наличии — кнопка «Купити» с data-product-*;
 * без наличия — карточка `product-block` с телефонами вместо кнопки.
 */
export function parsePromUaGroupListingProducts(
  $: cheerio.Root,
  currentPageUrl: string
): Map<string, PromUaGroupPageProduct> {
  const result = new Map<string, PromUaGroupPageProduct>();

  $('button[data-qaid="buy-button"][data-product-id]').each((_, el) => {
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

  $('li[data-qaid="product-block"][data-product-id]').each((_, el) => {
    const $card = $(el);
    const productId = $card.attr("data-product-id")?.trim();
    if (!productId || result.has(productId)) {
      return;
    }

    const $titleLink = $card.find("a.b-product-gallery__title").first();
    const $imgLink = $card.find("a.b-product-gallery__image-link").first();

    const href =
      $titleLink.attr("href")?.trim() ??
      $imgLink.attr("href")?.trim() ??
      "";
    const url = resolveUrl(href, currentPageUrl);
    if (!url) {
      return;
    }

    const titleFromText = $titleLink.text().trim();
    const titleFromAttr = $imgLink.attr("title")?.trim() ?? "";
    const rawTitle = titleFromText || titleFromAttr;
    const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
    if (!title) {
      return;
    }

    const $img = $imgLink.find("img").first();
    const rawImg =
      $img.attr("src")?.trim() ?? $img.attr("data-src")?.trim() ?? "";
    const imageUrl =
      resolveUrl(rawImg, currentPageUrl) ??
      (rawImg.startsWith("http") ? rawImg : null);
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
