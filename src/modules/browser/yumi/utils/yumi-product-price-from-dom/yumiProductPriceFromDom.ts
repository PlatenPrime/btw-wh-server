import * as cheerio from "cheerio";
import { parseStrippedDecimal } from "../../../utils/parse-stripped-decimal/parseStrippedDecimal.js";

export function parsePriceFromDom($: cheerio.Root): number | null {
  const wholesaleElements = $('[data-qaid="wholesale_price"]');
  const wholesalePrices: number[] = [];

  wholesaleElements.each((_, el) => {
    const text = $(el).text();
    const value = parseStrippedDecimal(text);
    if (value !== null) {
      wholesalePrices.push(value);
    }
  });

  if (wholesalePrices.length > 0) {
    return Math.min(...wholesalePrices);
  }

  const priceElement = $('[data-qaid="product_price"]').first();
  if (priceElement.length === 0) {
    return null;
  }

  const priceAttr = priceElement.attr("data-qaprice");
  const priceSource =
    priceAttr && priceAttr.trim().length > 0 ? priceAttr : priceElement.text();

  return parseStrippedDecimal(priceSource);
}
