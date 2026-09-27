import type { CheerioAPI } from "cheerio";
import { parseStrippedDecimal } from "../../../utils/parse-stripped-decimal/parseStrippedDecimal.js";

/**
 * Цена упаковки с DOM: `[data-qaid="product_price"]` (attr `data-qaprice` или text).
 */
export function parseDojdevikPackagePriceFromDom($: CheerioAPI): number | null {
  const priceElement = $('[data-qaid="product_price"]').first();
  if (priceElement.length === 0) {
    return null;
  }

  const priceAttr = priceElement.attr("data-qaprice");
  const priceSource =
    priceAttr && priceAttr.trim().length > 0 ? priceAttr : priceElement.text();

  return parseStrippedDecimal(priceSource);
}

export function parseDojdevikTitleFromDom($: CheerioAPI): string {
  return $('[data-qaid="product_name"]').first().text().trim();
}
