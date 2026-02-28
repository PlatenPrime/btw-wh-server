import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";

export interface YumiProductInfo {
  stock: number;
  price: number;
  title?: string;
}

function parseNumberFromText(raw: string | undefined | null): number | null {
  if (!raw) {
    return null;
  }

  const cleaned = raw.replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.replace(/,/g, ".");
  const value = parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

function extractPackCount(title: string): number | null {
  if (!title) {
    return null;
  }

  const patterns = [/\((\d+)\s*шт\.?\)/i, /(\d+)\s*шт\.?/i];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const count = parseInt(match[1], 10);
      if (Number.isFinite(count) && count > 0) {
        return count;
      }
    }
  }

  return null;
}

function parseStock($: cheerio.Root): number {
  const statusElement = $('[data-qaid="product_status_sticky_panel"]').first();

  if (statusElement.length > 0) {
    const raw = statusElement.attr("title") ?? statusElement.text();
    const text = raw.trim().toLowerCase();

    if (!text) {
      return 0;
    }

    if (text.includes("немає в наявності") || text.includes("нет в наличии")) {
      return 0;
    }

    if (text.includes("в наявності") || text.includes("в наличии")) {
      const numberMatch = text.match(/\d+/g);
      if (numberMatch && numberMatch.length > 0) {
        const parsed = parseInt(numberMatch[0], 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
  }

  const quantityInput = $('input[name="quantity_input"]').first();
  const maxAttr = quantityInput.attr("max");
  if (maxAttr && maxAttr.trim() !== "") {
    const parsed = parseInt(maxAttr.trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function parsePrice($: cheerio.Root): number | null {
  const wholesaleElements = $('[data-qaid="wholesale_price"]');
  const wholesalePrices: number[] = [];

  wholesaleElements.each((_, el) => {
    const text = $(el).text();
    const value = parseNumberFromText(text);
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

  return parseNumberFromText(priceSource);
}

const NEGATIVE_OUTCOME: YumiProductInfo = { stock: -1, price: -1 };

/**
 * Получает данные о количестве и цене товара со страницы товара сайта Yumi по ссылке.
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price, title? }; при негативном исходе — { stock: -1, price: -1 }
 * @throws Error при пустом/не-строковом link
 */
export async function getYumiStockData(link: string): Promise<YumiProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  try {
    const html = await browserGet<string>(link);
    const $ = cheerio.load(html);

    const title = $('[data-qaid="product_name"]').first().text().trim();

    let stock = parseStock($);
    const basePrice = parsePrice($);

    if (basePrice === null) {
      return NEGATIVE_OUTCOME;
    }

    const packCount = extractPackCount(title);
    const finalPrice =
      packCount && packCount > 1
        ? Number((basePrice / packCount).toFixed(2))
        : basePrice;

    if (packCount && packCount > 1 && stock > 0) {
      stock = stock * packCount;
    }

    return {
      stock,
      price: finalPrice,
      ...(title && { title }),
    };
  } catch (error) {
    return NEGATIVE_OUTCOME;
  }
}
