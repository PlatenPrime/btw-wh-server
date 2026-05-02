import * as cheerio from "cheerio";
const PRICE_TEXT_REGEX = /([\d\s,\.]+)\s*грн/i;
/**
 * Извлекает цену из текста элемента a.price.changePrice (формат «1.85 грн.»).
 */
export function parsePriceFromElement(text) {
    const match = text.trim().match(PRICE_TEXT_REGEX);
    if (!match?.[1])
        return null;
    const normalized = match[1].replace(/\s/g, "").replace(",", ".");
    const price = parseFloat(normalized);
    if (!Number.isFinite(price) || price < 0)
        return null;
    return price;
}
export function parsePriceFromProductHtml(html) {
    const $ = cheerio.load(html);
    const priceText = $("a.price.changePrice").first().text().trim();
    return parsePriceFromElement(priceText);
}
export function negativeSharteStockOutcome(id) {
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
 * Остаток 0 и цена с карточки товара, если цену удалось распарсить; иначе negativeSharteStockOutcome.
 */
export function stockInfoFromHtmlFallback(html, productId) {
    const price = parsePriceFromProductHtml(html);
    if (price === null)
        return negativeSharteStockOutcome(productId);
    return {
        id: productId,
        name: "",
        stock: 0,
        reserved: 0,
        available: 0,
        price,
    };
}
