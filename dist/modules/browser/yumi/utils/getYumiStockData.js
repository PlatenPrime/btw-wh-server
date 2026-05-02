import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";
import { YUMI_NEGATIVE_OUTCOME } from "./yumi-product-types/yumiProductInfo.js";
import { extractPackCount } from "./yumi-pack-count-from-title/extractPackCount.js";
import { parseStockFromDom } from "./yumi-product-stock-from-dom/yumiProductStockFromDom.js";
import { parsePriceFromDom } from "./yumi-product-price-from-dom/yumiProductPriceFromDom.js";
/**
 * Получает данные о количестве и цене товара со страницы товара сайта Yumi по ссылке.
 * @param link — URL страницы товара
 * @returns Promise с объектом { stock, price, title? }; при негативном исходе — { stock: -1, price: -1 }
 * @throws Error при пустом/не-строковом link
 */
export async function getYumiStockData(link) {
    if (!link || typeof link !== "string") {
        throw new Error("Link is required and must be a string");
    }
    try {
        const html = await browserGet(link);
        const $ = cheerio.load(html);
        const title = $('[data-qaid="product_name"]').first().text().trim();
        let stock = parseStockFromDom($);
        const basePrice = parsePriceFromDom($);
        if (basePrice === null) {
            return YUMI_NEGATIVE_OUTCOME;
        }
        const packCount = extractPackCount(title);
        const finalPrice = packCount && packCount > 1
            ? Number((basePrice / packCount).toFixed(2))
            : basePrice;
        if (packCount && packCount > 1 && stock > 0) {
            stock = stock * packCount;
        }
        return {
            stock,
            price: finalPrice,
            ...(title && { title }),
        };
    }
    catch {
        return YUMI_NEGATIVE_OUTCOME;
    }
}
