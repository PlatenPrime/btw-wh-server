import * as cheerio from "cheerio";
import { browserGet, logBrowserError } from "../../utils/browserRequest.js";
const SHARTE_ADD_CART_BASE = "https://sharte.net/ajax.php?act=addCart&id=${productId}&q=1&site_id=s1";
const PRICE_TEXT_REGEX = /([\d\s,\.]+)\s*грн/i;
/**
 * Парсит JSON ответ addCart; при пустом теле, не-объекте или невалидном JSON — null
 * (сайт для части товаров отдаёт HTML/текст вместо JSON).
 */
function tryParseAddCartJson(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
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
function parsePriceFromProductHtml(html) {
    const $ = cheerio.load(html);
    const priceText = $("a.price.changePrice").first().text().trim();
    return parsePriceFromElement(priceText);
}
/**
 * Извлекает productId из HTML страницы товара (элемент #catalogElement, data-product-id).
 */
function extractProductIdFromHtml(html) {
    const $ = cheerio.load(html);
    const productId = $("#catalogElement").attr("data-product-id");
    if (productId == null || String(productId).trim() === "")
        return null;
    return String(productId).trim();
}
function negativeOutcome(id) {
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
 * Остаток 0 и цена с карточки товара, если цену удалось распарсить; иначе negativeOutcome.
 */
function stockInfoFromHtmlFallback(html, productId) {
    const price = parsePriceFromProductHtml(html);
    if (price === null)
        return negativeOutcome(productId);
    return {
        id: productId,
        name: "",
        stock: 0,
        reserved: 0,
        available: 0,
        price,
    };
}
/**
 * Получает данные об остатках товара с sharte.net по URL страницы товара.
 * productId извлекается из HTML (div#catalogElement[data-product-id]).
 * Если addCart не возвращает валидный JSON или нет CATALOG_QUANTITY — цена с HTML (a.price.changePrice).
 * @param productUrl — URL страницы товара на sharte.net
 * @returns StockInfo; при негативном исходе — объект с stock: -1, price: -1
 */
export async function getSharteStockData(productUrl) {
    let productId = "";
    try {
        const url = productUrl.trim();
        if (url === "")
            return negativeOutcome("");
        const html = await browserGet(url);
        const extractedId = extractProductIdFromHtml(html);
        if (extractedId === null)
            return negativeOutcome("");
        productId = extractedId;
        const targetUrl = SHARTE_ADD_CART_BASE.replace("${productId}", productId);
        let addCartRaw;
        try {
            addCartRaw = await browserGet(targetUrl);
        }
        catch (addCartErr) {
            logBrowserError("Sharte addCart request failed, using HTML fallback:", addCartErr);
            return stockInfoFromHtmlFallback(html, productId);
        }
        const data = tryParseAddCartJson(addCartRaw);
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
        const price = data["~PRICE"] != null ? Number(data["~PRICE"]) : undefined;
        return {
            id: data.ID ?? productId,
            name: data["~NAME"] ?? "",
            stock,
            reserved: reservedSafe,
            available,
            ...(price !== undefined && !Number.isNaN(price) && { price }),
        };
    }
    catch (error) {
        logBrowserError("Error fetching data from sharte:", error);
        return negativeOutcome(productId);
    }
}
