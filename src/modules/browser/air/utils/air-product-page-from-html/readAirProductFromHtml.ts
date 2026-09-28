import * as cheerio from "cheerio";
import type { AirProductInfo } from "../air-product-types/airProductInfo.js";
import { AIR_NEGATIVE_OUTCOME } from "../air-product-types/airProductInfo.js";

/**
 * Читает остаток и цену со страницы товара Air (HTML).
 */
export function readAirProductFromHtml(html: string): AirProductInfo {
  const $ = cheerio.load(html);

  const quantityValue = $("#max-product-quantity").attr("value");
  let stock: number;
  if (quantityValue === undefined || quantityValue === "") {
    stock = 0;
  } else {
    const parsed = parseInt(quantityValue, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return AIR_NEGATIVE_OUTCOME;
    }
    stock = parsed;
  }

  const priceRaw =
    $(".us-price-actual").first().text().trim() ||
    $(".us-price-new").first().text().trim();
  if (!priceRaw) {
    return AIR_NEGATIVE_OUTCOME;
  }
  const priceStr = priceRaw.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const price = parseFloat(priceStr);
  if (Number.isNaN(price) || price < 0) {
    return AIR_NEGATIVE_OUTCOME;
  }

  return { stock, price };
}
