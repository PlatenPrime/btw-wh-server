import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";
/**
 * Получает данные о количестве и цене товара со страницы товара сайта air по ссылке.
 * При отсутствии товара в наличии (элемент #max-product-quantity отсутствует в разметке) возвращает stock: 0 при валидной цене.
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price } или null, если данные не найдены/невалидны
 * @throws Error при пустом/не-строковом link или ошибке запроса
 */
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
                return null;
            }
            stock = parsed;
        }
        const priceRaw = $(".us-price-actual").first().text().trim();
        if (!priceRaw) {
            return null;
        }
        const priceStr = priceRaw.replace(/[^\d.,]/g, "").replace(/,/g, ".");
        const price = parseFloat(priceStr);
        if (Number.isNaN(price) || price < 0) {
            return null;
        }
        return { stock, price };
    }
    catch (error) {
        console.error("Error fetching data from air product page:", error);
        throw new Error(`Failed to fetch data from air: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
