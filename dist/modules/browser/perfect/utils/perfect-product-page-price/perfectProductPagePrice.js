import * as cheerio from "cheerio";
import { parseNumberLike } from "../parse-number-like/parseNumberLike.js";
export function extractDisplayPriceFromProductHtml(html) {
    const $ = cheerio.load(html);
    const metaAmount = $('meta[property="product:price:amount"]').attr("content");
    const fromMeta = parseNumberLike(metaAmount);
    if (fromMeta !== null)
        return fromMeta;
    const priceEl = $("[itemprop=price]").first();
    const fromItempropContent = parseNumberLike(priceEl.attr("content"));
    if (fromItempropContent !== null)
        return fromItempropContent;
    const fromItempropText = parseNumberLike(priceEl.text());
    if (fromItempropText !== null)
        return fromItempropText;
    const currentPriceText = $(".current-price, .product-price .current-price")
        .first()
        .text();
    const fromCurrent = parseNumberLike(currentPriceText);
    if (fromCurrent !== null)
        return fromCurrent;
    const priceAmountMatch = html.match(/"price_amount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
    if (priceAmountMatch?.[1]) {
        const n = parseNumberLike(priceAmountMatch[1]);
        if (n !== null)
            return n;
    }
    return null;
}
export function isPerfectProductPageOutOfStock(html) {
    const $ = cheerio.load(html);
    const availMeta = $('meta[property="product:availability"]').attr("content") ?? "";
    if (/out_of_stock|unavailable|discontinued/i.test(availMeta)) {
        return true;
    }
    const schemaOos = $("link[itemprop=availability]")
        .toArray()
        .some((el) => {
        const href = $(el).attr("href") ?? "";
        return /OutOfStock/i.test(href);
    });
    if (schemaOos)
        return true;
    const flagsBlock = $(".product-flags");
    if (flagsBlock.length) {
        const flagText = flagsBlock.text();
        if (/розпродано/i.test(flagText))
            return true;
        if (flagsBlock.find('[class*="out-of-stock"], [class*="out_of_stock"], .product-flag--out-of-stock')
            .length) {
            return true;
        }
    }
    return false;
}
