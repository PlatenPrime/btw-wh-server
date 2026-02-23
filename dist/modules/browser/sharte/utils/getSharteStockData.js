import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";
const SHARTE_ADD_CART_BASE = "https://sharte.net/ajax.php?act=addCart&id=${productId}&q=1&site_id=s1";
const PRICE_TEXT_REGEX = /([\d\s,\.]+)\s*грн/i;
/**
 * Извлекает цену из текста элемента a.price.changePrice (формат «1.85 грн.»).
 */
function parsePriceFromElement(text) {
    const match = text.trim().match(PRICE_TEXT_REGEX);
    if (!match?.[1])
        return null;
    const normalized = match[1].replace(/\s/g, "").replace(",", ".");
    const price = parseFloat(normalized);
    if (!Number.isFinite(price) || price < 0)
        return null;
    return price;
}
/**
 * Получает данные об остатках товара с sharte.net по ID товара.
 * Если addCart не возвращает остатки (товар не в наличии), при переданном productUrl
 * запрашивает страницу товара и извлекает цену из элемента a.price.changePrice (текст «X грн.»).
 * @param productId — ID товара на sharte.net
 * @param productUrl — URL страницы товара для fallback-парсинга цены при отсутствии в наличии
 * @returns StockInfo или null, если товар не найден или данные скрыты
 * @throws Error при ошибке запроса addCart (fallback по productUrl при ошибке возвращает null)
 */
export async function getSharteStockData(productId, productUrl) {
    const targetUrl = SHARTE_ADD_CART_BASE.replace("${productId}", productId);
    const data = await browserGet(targetUrl);
    if (!data || data.CATALOG_QUANTITY === undefined) {
        if (!productUrl || typeof productUrl !== "string" || productUrl.trim() === "") {
            return null;
        }
        try {
            const html = await browserGet(productUrl.trim());
            const $ = cheerio.load(html);
            const priceText = $("a.price.changePrice").first().text().trim();
            const price = parsePriceFromElement(priceText);
            if (price === null)
                return null;
            return {
                id: productId,
                name: "",
                stock: 0,
                reserved: 0,
                available: 0,
                price,
            };
        }
        catch {
            return null;
        }
    }
    const stock = parseInt(String(data.CATALOG_QUANTITY), 10);
    const reserved = parseInt(String(data.CATALOG_QUANTITY_RESERVED ?? 0), 10);
    const available = stock - reserved;
    const price = data["~PRICE"] != null ? Number(data["~PRICE"]) : undefined;
    return {
        id: data.ID ?? productId,
        name: data["~NAME"] ?? "",
        stock,
        reserved,
        available,
        ...(price !== undefined && !Number.isNaN(price) && { price }),
    };
}
