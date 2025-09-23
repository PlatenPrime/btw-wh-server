import axios from "axios";
import * as cheerio from "cheerio";

export interface SharikProductInfo {
  nameukr: string;
  price: number;
  quantity: number;
}

/**
 * Получает данные о товаре с сайта sharik.ua по артикулу
 * @param artikul - артикул товара в виде строки
 * @returns Promise с данными о товаре или null, если товар не найден
 * @throws Error при ошибке запроса или парсинга
 */
export const getSharikData = async (
  artikul: string
): Promise<SharikProductInfo | null> => {
  if (!artikul || typeof artikul !== "string") {
    throw new Error("Artikul is required and must be a string");
  }

  try {
    const targetUrl = `https://sharik.ua/ua/search/?q=${encodeURIComponent(
      artikul
    )}`;
    const { data: html } = await axios.get(targetUrl);
    const $ = cheerio.load(html);

    const productElements = $(".car-col .one-item");

    if (productElements.length === 0) {
      return null;
    }

    const firstElement = productElements.eq(0);
    const data = parseSharikElement(firstElement);

    return data || null;
  } catch (error) {
    console.error("Error fetching data from sharik.ua:", error);
    throw new Error(
      `Failed to fetch data from sharik.ua: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Парсит элемент товара с сайта sharik.ua
 * @param artElement - Cheerio элемент товара
 * @returns данные о товаре или undefined, если данные неполные
 */
function parseSharikElement(
  artElement: cheerio.Cheerio
): SharikProductInfo | undefined {
  const nameukr = artElement.find(".one-item-tit").text().trim();
  const priceRaw = artElement.find(".one-item-price").text().trim();
  const quantityRaw = artElement.find(".one-item-quantity").text().trim();

  if (!nameukr || !priceRaw || !quantityRaw) {
    console.warn("Incomplete product data:", {
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
    console.warn("Invalid quantity format:", { quantityRaw });
    return undefined;
  }
  const quantity = parseInt(quantityMatch[0], 10);

  if (isNaN(price)) {
    console.warn("Invalid price format:", { priceStr, quantityRaw });
    return undefined;
  }

  return { nameukr, price, quantity };
}
