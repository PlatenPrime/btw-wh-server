import type { StockInfo } from "../../utils/types.js";
import { browserGet, logBrowserError } from "../../utils/browserRequest.js";
import { tryParseJsonRecord } from "../../utils/try-parse-json-record/tryParseJsonRecord.js";
import { extractCatalogProductId } from "./sharte-catalog-product-id/extractCatalogProductId.js";
import {
  negativeSharteStockOutcome,
  stockInfoFromHtmlFallback,
} from "./sharte-html-price-fallback/sharteHtmlPriceFallback.js";

const SHARTE_ADD_CART_BASE =
  "https://sharte.net/ajax.php?act=addCart&id=${productId}&q=1&site_id=s1";

interface SharteAddCartResponse {
  ID?: string | number;
  "~NAME"?: string;
  CATALOG_QUANTITY?: number | null;
  CATALOG_QUANTITY_RESERVED?: number | null;
  "~PRICE"?: number | string;
}

/**
 * Получает данные об остатках товара с sharte.net по URL страницы товара.
 * productId извлекается из HTML (div#catalogElement[data-product-id]).
 * Если addCart не возвращает валидный JSON или нет CATALOG_QUANTITY — цена с HTML (a.price.changePrice).
 * @param productUrl — URL страницы товара на sharte.net
 * @returns StockInfo; при негативном исходе — объект с stock: -1, price: -1
 */
export async function getSharteStockData(
  productUrl: string
): Promise<StockInfo> {
  let productId = "";
  try {
    const url = productUrl.trim();
    if (url === "") return negativeSharteStockOutcome("");

    const html = await browserGet<string>(url);
    const extractedId = extractCatalogProductId(html);
    if (extractedId === null) return negativeSharteStockOutcome("");
    productId = extractedId;

    const targetUrl = SHARTE_ADD_CART_BASE.replace("${productId}", productId);

    let addCartRaw: string;
    try {
      addCartRaw = await browserGet<string>(targetUrl);
    } catch (addCartErr) {
      logBrowserError("Sharte addCart request failed, using HTML fallback:", addCartErr);
      return stockInfoFromHtmlFallback(html, productId);
    }

    const data = tryParseJsonRecord(addCartRaw) as SharteAddCartResponse | null;
    if (data === null) {
      return stockInfoFromHtmlFallback(html, productId);
    }

    const rawQty = data.CATALOG_QUANTITY;
    if (rawQty == null) {
      return stockInfoFromHtmlFallback(html, productId);
    }

    const stock = parseInt(String(rawQty), 10);
    if (Number.isNaN(stock)) {
      return stockInfoFromHtmlFallback(html, productId);
    }

    const reservedRaw = data.CATALOG_QUANTITY_RESERVED ?? 0;
    const reserved = parseInt(String(reservedRaw), 10);
    const reservedSafe = Number.isNaN(reserved) ? 0 : reserved;
    const available = stock - reservedSafe;

    const price =
      data["~PRICE"] != null ? Number(data["~PRICE"]) : undefined;

    return {
      id: data.ID ?? productId,
      name: data["~NAME"] ?? "",
      stock,
      reserved: reservedSafe,
      available,
      ...(price !== undefined && !Number.isNaN(price) && { price }),
    };
  } catch (error) {
    logBrowserError("Error fetching data from sharte:", error);
    return negativeSharteStockOutcome(productId);
  }
}
