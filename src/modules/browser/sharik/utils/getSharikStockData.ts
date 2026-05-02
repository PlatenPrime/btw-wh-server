import * as cheerio from "cheerio";
import {
  browserGet,
  logBrowserError,
  summarizeBrowserError,
} from "../../utils/browserRequest.js";
import type { SharikProductInfo } from "./sharik-product-types/sharikProductInfo.js";
import { parseSharikSearchCard } from "./sharik-search-result-card/parseSharikSearchCard.js";

export type { SharikProductInfo } from "./sharik-product-types/sharikProductInfo.js";

/**
 * Получает данные о товаре с сайта sharik.ua по артикулу
 * @param artikul - артикул товара в виде строки
 * @returns Promise с данными о товаре или null, если товар не найден
 * @throws Error при ошибке запроса или парсинга
 */
export async function getSharikStockData(
  artikul: string
): Promise<SharikProductInfo | null> {
  if (!artikul || typeof artikul !== "string") {
    throw new Error("Artikul is required and must be a string");
  }

  try {
    const targetUrl = `https://sharik.ua/ua/search/?q=${encodeURIComponent(
      artikul
    )}`;
    const html = await browserGet<string>(targetUrl);
    const $ = cheerio.load(html);

    const productElements = $(".car-col .one-item");

    if (productElements.length === 0) {
      return null;
    }

    const firstElement = productElements.eq(0);
    const data = parseSharikSearchCard(artikul, firstElement);

    return data || null;
  } catch (error) {
    logBrowserError("Error fetching data from sharik.ua:", error);
    throw new Error(
      `Failed to fetch data from sharik.ua: ${summarizeBrowserError(error)}`
    );
  }
}
