import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";

export interface BalunProductInfo {
  stock: number;
  price: number;
}

interface FbProductData {
  contents?: Array<{ id?: number; quantity?: number }>;
}

interface AnalyticsData {
  clerk?: { price_original?: string };
}

/**
 * Парсит JSON из data-атрибута; при необходимости декодирует HTML-entities.
 */
function parseJsonAttr(raw: string | undefined): unknown {
  if (raw === undefined || raw === "") {
    return undefined;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const decoded = raw
      .replace(/&#34;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
    return JSON.parse(decoded) as unknown;
  }
}

/**
 * Получает данные о количестве и цене товара со страницы товара сайта Balun по ссылке.
 * Stock берётся из data-advtracking-fb-product-data (contents[0].quantity), при отсутствии ключа — 0.
 * Price берётся из data-analytics (clerk.price_original).
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price }; при негативном исходе — { stock: -1, price: -1 }
 * @throws Error при пустом/не-строковом link
 */
const NEGATIVE_OUTCOME: BalunProductInfo = { stock: -1, price: -1 };

export async function getBalunStockData(
  link: string
): Promise<BalunProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  try {
    const html = await browserGet<string>(link);
    const $ = cheerio.load(html);

    let stock = 0;
    const fbAttr = $("[data-advtracking-fb-product-data]").first().attr(
      "data-advtracking-fb-product-data"
    );
    const fbData = parseJsonAttr(fbAttr) as FbProductData | undefined;
    if (fbData?.contents?.[0] != null && typeof fbData.contents[0].quantity === "number") {
      const q = fbData.contents[0].quantity;
      if (Number.isFinite(q) && q >= 0) {
        stock = q;
      }
    }

    const analyticsAttr = $("[data-analytics]").first().attr("data-analytics");
    const analyticsData = parseJsonAttr(analyticsAttr) as AnalyticsData | undefined;
    const priceOriginal = analyticsData?.clerk?.price_original;
    if (priceOriginal === undefined || priceOriginal === "") {
      return NEGATIVE_OUTCOME;
    }
    const price = parseFloat(String(priceOriginal).replace(/,/g, "."));
    if (Number.isNaN(price) || price < 0) {
      return NEGATIVE_OUTCOME;
    }

    return { stock, price };
  } catch (error) {
    console.error("Error fetching data from balun product page:", error);
    return NEGATIVE_OUTCOME;
  }
}
