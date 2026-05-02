import * as cheerio from "cheerio";
import { YUMIN_NEGATIVE_OUTCOME } from "../yumin-product-types/yuminProductInfo.js";
import { extractPieceCountFromTitle } from "../yumin-piece-count-from-title/extractPieceCountFromTitle.js";
import { parseCustomizableOptions } from "../yumin-customizable-options/yuminCustomizableOptions.js";
import { parseWholesalePrices } from "../yumin-wholesale-prices/yuminWholesalePrices.js";
import { pickNameForPieceCount, pickTitle } from "../yumin-pick-title/yuminPickTitle.js";
/**
 * Парсит HTML страницы товара Yumin (yumi.market и совместимая вёрстка).
 * @returns { stock, price, title? }; при отсутствии обязательных данных — { stock: -1, price: -1 }
 */
export function parseYuminProductHtml(html) {
    if (!html || typeof html !== "string") {
        return YUMIN_NEGATIVE_OUTCOME;
    }
    const options = parseCustomizableOptions(html);
    if (!options) {
        return YUMIN_NEGATIVE_OUTCOME;
    }
    const $ = cheerio.load(html);
    const title = pickTitle($);
    const pieceCount = extractPieceCountFromTitle(pickNameForPieceCount($));
    const wholesalePrices = parseWholesalePrices(html);
    let basePrice = options.initialPrice;
    if (wholesalePrices.length > 0) {
        basePrice = Math.min(options.initialPrice, ...wholesalePrices);
    }
    let stock = options.flatQty;
    let price = basePrice;
    if (pieceCount !== null && pieceCount > 0) {
        price = Number((basePrice / pieceCount).toFixed(2));
        stock = options.flatQty * pieceCount;
    }
    return {
        stock,
        price,
        ...(title.length > 0 && { title }),
    };
}
