import * as cheerio from "cheerio";
import type { SharikProductInfo } from "../sharik-product-types/sharikProductInfo.js";
import { logModuleError, logModuleWarn } from "../../../../../logging/logModuleError.js";

/**
 * Парсит элемент товара с сайта sharik.ua (карточка в результатах поиска).
 */
export function parseSharikSearchCard(
  artikul: string,
  artElement: cheerio.Cheerio
): SharikProductInfo | undefined {
  const nameukr = artElement.find(".one-item-tit").text().trim();
  const priceRaw = artElement.find(".one-item-price").text().trim();
  const quantityRaw = artElement.find(".one-item-quantity").text().trim();

  if (!nameukr || !priceRaw || !quantityRaw) {
    logModuleWarn("browser", "Incomplete product data:", {
      artikul,
      nameukr,
      priceRaw,
      quantityRaw,
    });
    return undefined;
  }

  const priceStr = priceRaw.replace(/[^\d.,]/g, "").replace(/,/g, "");
  const price = parseFloat(priceStr);

  const quantityMatch = quantityRaw.match(/\d+/);
  if (!quantityMatch) {
    logModuleWarn("browser", "Invalid quantity format:", { artikul, quantityRaw });
    return undefined;
  }
  const quantity = parseInt(quantityMatch[0], 10);

  if (isNaN(price)) {
    logModuleWarn("browser", "Invalid price format:", { artikul, priceStr, quantityRaw });
    return undefined;
  }

  return { nameukr, price, quantity };
}
