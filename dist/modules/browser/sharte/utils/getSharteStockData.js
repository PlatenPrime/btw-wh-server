import { browserGet } from "../../utils/browserRequest.js";
const SHARTE_ADD_CART_BASE = "https://sharte.net/ajax.php?act=addCart&id=${productId}&q=1&site_id=s1";
/**
 * Получает данные об остатках товара с sharte.net по ID товара.
 * @param productId — ID товара на sharte.net
 * @returns StockInfo или null, если товар не найден или данные скрыты
 * @throws Error при ошибке запроса или парсинга
 */
export async function getSharteStockData(productId) {
    const targetUrl = SHARTE_ADD_CART_BASE.replace("${productId}", productId);
    const data = await browserGet(targetUrl);
    if (!data || data.CATALOG_QUANTITY === undefined) {
        return null;
    }
    const stock = parseInt(String(data.CATALOG_QUANTITY), 10);
    const reserved = parseInt(String(data.CATALOG_QUANTITY_RESERVED ?? 0), 10);
    const available = stock - reserved;
    return {
        id: data.ID ?? productId,
        name: data["~NAME"] ?? "",
        stock,
        reserved,
        available,
    };
}
