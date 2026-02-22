import type { StockInfo } from "../../utils/types.js";
import { browserGet } from "../../utils/browserRequest.js";

const SHARTE_ADD_CART_BASE =
  "https://sharte.net/ajax.php?act=addCart&id=${productId}&q=1&site_id=s1";

interface SharteAddCartResponse {
  ID?: string | number;
  "~NAME"?: string;
  CATALOG_QUANTITY?: number;
  CATALOG_QUANTITY_RESERVED?: number;
}

/**
 * Получает данные об остатках товара с sharte.net по ID товара.
 * @param productId — ID товара на sharte.net
 * @returns StockInfo или null, если товар не найден или данные скрыты
 * @throws Error при ошибке запроса или парсинга
 */
export async function getSharteStockData(
  productId: string
): Promise<StockInfo | null> {
  const targetUrl = SHARTE_ADD_CART_BASE.replace("${productId}", productId);
  const data = await browserGet<SharteAddCartResponse>(targetUrl);

  if (!data || data.CATALOG_QUANTITY === undefined) {
    return null;
  }

  const stock = parseInt(String(data.CATALOG_QUANTITY), 10);
  const reserved = parseInt(
    String(data.CATALOG_QUANTITY_RESERVED ?? 0),
    10
  );
  const available = stock - reserved;

  return {
    id: data.ID ?? productId,
    name: data["~NAME"] ?? "",
    stock,
    reserved,
    available,
  };
}
