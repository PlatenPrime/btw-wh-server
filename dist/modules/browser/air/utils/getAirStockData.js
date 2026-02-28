import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";
/**
 * Получает данные о количестве и цене товара со страницы товара сайта air по ссылке.
 * При отсутствии товара в наличии (элемент #max-product-quantity отсутствует в разметке) возвращает stock: 0 при валидной цене.
 * При скидке цена берётся из .us-price-new, если .us-price-actual пуст.
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price }; при негативном исходе — { stock: -1, price: -1 }
 * @throws Error при пустом/не-строковом link
 */
const NEGATIVE_OUTCOME = { stock: -1, price: -1 };
export async function getAirStockData(link) {
    if (!link || typeof link !== "string") {
        throw new Error("Link is required and must be a string");
    }
    try {
        const html = await browserGet(link);
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
    catch (error) {
        console.error("Error fetching data from air product page:", error);
        return NEGATIVE_OUTCOME;
    }
}
