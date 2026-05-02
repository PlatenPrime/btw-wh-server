import * as cheerio from "cheerio";
/**
 * Извлекает productId из HTML страницы товара (элемент #catalogElement, data-product-id).
 */
export function extractCatalogProductId(html) {
    const $ = cheerio.load(html);
    const productId = $("#catalogElement").attr("data-product-id");
    if (productId == null || String(productId).trim() === "")
        return null;
    return String(productId).trim();
}
