import * as cheerio from "cheerio";

/**
 * Артикул/код с карточки Prom.ua company site: `[data-qaid="product_code"]`.
 */
export function extractPromUaProductArtikul(html: string): string | undefined {
  if (!html || typeof html !== "string") {
    return undefined;
  }

  const $ = cheerio.load(html);
  const $code = $('[data-qaid="product_code"]').first();
  if ($code.length === 0) {
    return undefined;
  }

  const fromTitle = $code.attr("title")?.trim();
  if (fromTitle) {
    return fromTitle;
  }

  const text = $code.text().trim();
  return text || undefined;
}
