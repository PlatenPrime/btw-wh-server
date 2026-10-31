import * as cheerio from "cheerio";
import type { AirProductInfo } from "../air-product-types/airProductInfo.js";
import { AIR_NEGATIVE_OUTCOME } from "../air-product-types/airProductInfo.js";

function extractAirArtikul($: cheerio.CheerioAPI): string | undefined {
  const code = $(".us-product-info-code").first().text().trim();
  return code || undefined;
}

function withArtikul(result: AirProductInfo, artikul: string | undefined): AirProductInfo {
  return artikul ? { ...result, artikul } : result;
}

/**
 * Читает остаток, цену и артикул со страницы товара Air (HTML).
 */
export function readAirProductFromHtml(html: string): AirProductInfo {
  const $ = cheerio.load(html);
  const artikul = extractAirArtikul($);

  const quantityValue = $("#max-product-quantity").attr("value");
  let stock: number;
  if (quantityValue === undefined || quantityValue === "") {
    stock = 0;
  } else {
    const parsed = parseInt(quantityValue, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return withArtikul(AIR_NEGATIVE_OUTCOME, artikul);
    }
    stock = parsed;
  }

  const priceRaw =
    $(".us-price-actual").first().text().trim() || $(".us-price-new").first().text().trim();
  if (!priceRaw) {
    return withArtikul(AIR_NEGATIVE_OUTCOME, artikul);
  }
  const priceStr = priceRaw.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const price = parseFloat(priceStr);
  if (Number.isNaN(price) || price < 0) {
    return withArtikul(AIR_NEGATIVE_OUTCOME, artikul);
  }

  return withArtikul({ stock, price }, artikul);
}
