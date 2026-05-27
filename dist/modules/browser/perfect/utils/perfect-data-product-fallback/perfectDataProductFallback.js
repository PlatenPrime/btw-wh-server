import * as cheerio from "cheerio";
import { parseNumberLike } from "../parse-number-like/parseNumberLike.js";
import { extractDisplayPriceFromProductHtml, isPerfectProductPageOutOfStock, } from "../perfect-product-page-price/perfectProductPagePrice.js";
import { toStockAndPrice } from "../perfect-per-piece-stock/perfectPerPieceStock.js";
function parseDataProductAttr(raw) {
    if (!raw?.trim())
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed;
        }
    }
    catch {
        return null;
    }
    return null;
}
function decodeDataProductAttrValue(encoded) {
    return encoded
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'");
}
export function extractDataProductFromHtml(html) {
    const $ = cheerio.load(html);
    const fromAttr = parseDataProductAttr($("#product-details[data-product]").attr("data-product"));
    if (fromAttr)
        return fromAttr;
    const dataProductMatch = html.match(/data-product="([^"]+)"/);
    if (dataProductMatch?.[1]) {
        return parseDataProductAttr(decodeDataProductAttrValue(dataProductMatch[1]));
    }
    return extractDataProductFieldsFromHtmlRegex(html);
}
/** Regex-fallback, если JSON в data-product не парсится целиком. */
export function extractDataProductFieldsFromHtmlRegex(html) {
    const normalized = html
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'");
    const quantityMatch = normalized.match(/"quantity"\s*:\s*(\d+)/);
    const priceAmountMatch = normalized.match(/"price_amount"\s*:\s*(\d+(?:\.\d+)?)/);
    const priceTaxExcMatch = normalized.match(/"price_tax_exc"\s*:\s*(\d+(?:\.\d+)?)/);
    const nameMatch = normalized.match(/"name"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (!quantityMatch?.[1] && !priceAmountMatch?.[1] && !priceTaxExcMatch?.[1]) {
        return null;
    }
    const record = {};
    if (quantityMatch?.[1])
        record.quantity = quantityMatch[1];
    if (priceAmountMatch?.[1])
        record.price_amount = priceAmountMatch[1];
    else if (priceTaxExcMatch?.[1])
        record.price_tax_exc = priceTaxExcMatch[1];
    if (nameMatch?.[1]) {
        try {
            record.name = JSON.parse(`"${nameMatch[1]}"`);
        }
        catch {
            record.name = nameMatch[1];
        }
    }
    return record;
}
export function tryPerfectDataProductFallback(html, pageTitle) {
    if (isPerfectProductPageOutOfStock(html))
        return null;
    const dataProduct = extractDataProductFromHtml(html) ?? extractDataProductFieldsFromHtmlRegex(html);
    if (!dataProduct)
        return null;
    const stockPacksRaw = parseNumberLike(dataProduct.quantity);
    let packPrice = parseNumberLike(dataProduct.price_amount) ??
        parseNumberLike(dataProduct.price_tax_exc) ??
        parseNumberLike(dataProduct.price_without_reduction);
    if (packPrice === null && stockPacksRaw !== null) {
        packPrice = extractDisplayPriceFromProductHtml(html);
    }
    if (stockPacksRaw === null || packPrice === null)
        return null;
    const stockPacks = Math.floor(stockPacksRaw);
    if (!Number.isFinite(stockPacks) || stockPacks < 0)
        return null;
    const nameFromData = typeof dataProduct.name === "string" ? dataProduct.name.trim() : "";
    const title = nameFromData || pageTitle.trim();
    return {
        ...toStockAndPrice(stockPacks, packPrice, title, html),
        source: "data-product",
    };
}
