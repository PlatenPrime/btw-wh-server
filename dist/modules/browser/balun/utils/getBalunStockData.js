import * as cheerio from "cheerio";
import { browserGet, logBrowserError } from "../../utils/browserRequest.js";
import { parseJsonHtmlAttribute } from "../../utils/parse-json-html-attribute/parseJsonHtmlAttribute.js";
/**
 * Получает данные о количестве и цене товара со страницы товара сайта Balun по ссылке.
 * Stock берётся из data-advtracking-fb-product-data (contents[0].quantity), при отсутствии ключа — 0.
 * Price берётся из data-analytics (clerk.price_original).
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price }; при негативном исходе — { stock: -1, price: -1 }
 * @throws Error при пустом/не-строковом link
 */
const NEGATIVE_OUTCOME = { stock: -1, price: -1 };
export async function getBalunStockData(link) {
    if (!link || typeof link !== "string") {
        throw new Error("Link is required and must be a string");
    }
    try {
        const html = await browserGet(link);
        const $ = cheerio.load(html);
        let stock = 0;
        const fbAttr = $("[data-advtracking-fb-product-data]").first().attr("data-advtracking-fb-product-data");
        const fbData = parseJsonHtmlAttribute(fbAttr);
        if (fbData?.contents?.[0] != null && typeof fbData.contents[0].quantity === "number") {
            const q = fbData.contents[0].quantity;
            if (Number.isFinite(q) && q >= 0) {
                stock = q;
            }
        }
        const analyticsAttr = $("[data-analytics]").first().attr("data-analytics");
        const analyticsData = parseJsonHtmlAttribute(analyticsAttr);
        const priceOriginal = analyticsData?.clerk?.price_original;
        if (priceOriginal === undefined || priceOriginal === "") {
            return NEGATIVE_OUTCOME;
        }
        const price = parseFloat(String(priceOriginal).replace(/,/g, "."));
        if (Number.isNaN(price) || price < 0) {
            return NEGATIVE_OUTCOME;
        }
        return { stock, price };
    }
    catch (error) {
        logBrowserError("Error fetching data from balun product page:", error);
        return NEGATIVE_OUTCOME;
    }
}
