import * as cheerio from "cheerio";
import type { StockInfo } from "../../utils/types.js";
import { browserGet } from "../../utils/browserRequest.js";

const SHARTE_ADD_CART_BASE =
  "https://sharte.net/ajax.php?act=addCart&id=${productId}&q=1&site_id=s1";

const PRICE_TEXT_REGEX = /([\d\s,\.]+)\s*грн/i;

interface SharteAddCartResponse {
  ID?: string | number;
  "~NAME"?: string;
  CATALOG_QUANTITY?: number;
  CATALOG_QUANTITY_RESERVED?: number;
  "~PRICE"?: number | string;
}

/**
 * Извлекает цену из текста элемента a.price.changePrice (формат «1.85 грн.»).
 */
function parsePriceFromElement(text: string): number | null {
  const match = text.trim().match(PRICE_TEXT_REGEX);
  if (!match?.[1]) return null;
  const normalized = match[1].replace(/\s/g, "").replace(",", ".");
  const price = parseFloat(normalized);
  if (!Number.isFinite(price) || price < 0) return null;
  return price;
}

/**
 * Извлекает productId из HTML страницы товара (элемент #catalogElement, data-product-id).
 */
function extractProductIdFromHtml(html: string): string | null {
  const $ = cheerio.load(html);
  const productId = $("#catalogElement").attr("data-product-id");
  if (productId == null || String(productId).trim() === "") return null;
  return String(productId).trim();
}

function negativeOutcome(id: string): StockInfo {
  return {
    id,
    name: "",
    stock: -1,
    reserved: 0,
    available: -1,
    price: -1,
  };
}

/**
 * Получает данные об остатках товара с sharte.net по URL страницы товара.
 * productId извлекается из HTML (div#catalogElement[data-product-id]).
 * Если addCart не возвращает остатки — цена парсится из той же HTML (a.price.changePrice).
 * @param productUrl — URL страницы товара на sharte.net
 * @returns StockInfo; при негативном исходе — объект с stock: -1, price: -1
 */
export async function getSharteStockData(
  productUrl: string
): Promise<StockInfo> {
  let productId = "";
  try {
    const url = productUrl.trim();
    if (url === "") return negativeOutcome("");

    const html = await browserGet<string>(url);
    const extractedId = extractProductIdFromHtml(html);
    if (extractedId === null) return negativeOutcome("");
    productId = extractedId;

    const targetUrl = SHARTE_ADD_CART_BASE.replace("${productId}", productId);
    const data = await browserGet<SharteAddCartResponse>(targetUrl);

    if (!data || data.CATALOG_QUANTITY === undefined) {
      const $ = cheerio.load(html);
      const priceText = $("a.price.changePrice").first().text().trim();
      const price = parsePriceFromElement(priceText);
      if (price === null) return negativeOutcome(productId);
      return {
        id: productId,
        name: "",
        stock: 0,
        reserved: 0,
        available: 0,
        price,
      };
    }

    const stock = parseInt(String(data.CATALOG_QUANTITY), 10);
    const reserved = parseInt(
      String(data.CATALOG_QUANTITY_RESERVED ?? 0),
      10
    );
    const available = stock - reserved;

    const price =
      data["~PRICE"] != null ? Number(data["~PRICE"]) : undefined;

    return {
      id: data.ID ?? productId,
      name: data["~NAME"] ?? "",
      stock,
      reserved,
      available,
      ...(price !== undefined && !Number.isNaN(price) && { price }),
    };
  } catch (error) {
    console.error("Error fetching data from sharte:", error);
    return negativeOutcome(productId);
  }
}
