import * as cheerio from "cheerio";
const NEGATIVE_OUTCOME = { stock: -1, price: -1 };
/**
 * Читает остаток и цену со страницы товара Air (HTML).
 */
export function readAirProductFromHtml(html) {
    const $ = cheerio.load(html);
    const quantityValue = $("#max-product-quantity").attr("value");
    let stock;
    if (quantityValue === undefined || quantityValue === "") {
        stock = 0;
    }
    else {
        const parsed = parseInt(quantityValue, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
            return NEGATIVE_OUTCOME;
        }
        stock = parsed;
    }
    const priceRaw = $(".us-price-actual").first().text().trim() ||
        $(".us-price-new").first().text().trim();
    if (!priceRaw) {
        return NEGATIVE_OUTCOME;
    }
    const priceStr = priceRaw.replace(/[^\d.,]/g, "").replace(/,/g, ".");
    const price = parseFloat(priceStr);
    if (Number.isNaN(price) || price < 0) {
        return NEGATIVE_OUTCOME;
    }
    return { stock, price };
}
