import * as cheerio from "cheerio";
import { browserGet } from "../../../utils/browserRequest.js";
import { getBalunGroupPagesProductsSchema, } from "./getBalunGroupPagesProductsSchema.js";
function resolveUrl(href, baseUrl) {
    const trimmed = href.trim();
    if (!trimmed) {
        return null;
    }
    try {
        return new URL(trimmed, baseUrl).toString();
    }
    catch {
        return null;
    }
}
function decodeHtmlEntities(input) {
    const numericDecoded = input.replace(/&#(x?[0-9a-fA-F]+);/g, (_match, rawCode) => {
        const code = rawCode.startsWith("x") || rawCode.startsWith("X")
            ? rawCode.slice(1)
            : rawCode;
        const base = rawCode.startsWith("x") || rawCode.startsWith("X") ? 16 : 10;
        const codePoint = Number.parseInt(code, base);
        if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
            return _match;
        }
        return String.fromCodePoint(codePoint);
    });
    return numericDecoded
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}
function parseProductsFromPage($, currentPageUrl) {
    const result = new Map();
    $('button[data-qaid="buy-button"][data-product-id]').each((_, el) => {
        const $el = $(el);
        const productId = $el.attr("data-product-id")?.trim();
        const rawTitle = $el.attr("data-product-name")?.trim();
        const rawUrl = $el.attr("data-product-url")?.trim();
        const imageUrl = $el.attr("data-product-big-picture")?.trim();
        if (!productId || !rawTitle || !rawUrl || !imageUrl) {
            return;
        }
        const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
        const url = resolveUrl(rawUrl, currentPageUrl);
        if (!title || !url) {
            return;
        }
        result.set(productId, {
            productId,
            title,
            url,
            imageUrl,
        });
    });
    return result;
}
function getNextPageUrl($, currentPageUrl) {
    const nextHref = $('link[rel="next"]').first().attr("href")?.trim();
    if (!nextHref) {
        return null;
    }
    return resolveUrl(nextHref, currentPageUrl);
}
export async function getBalunGroupPagesProducts(input) {
    const parseResult = getBalunGroupPagesProductsSchema.safeParse(input);
    if (!parseResult.success) {
        throw new Error(parseResult.error.message);
    }
    const { groupUrl, maxPages = 50 } = parseResult.data;
    const visited = new Set();
    const products = new Map();
    let currentUrl = groupUrl;
    let fetchedPages = 0;
    while (currentUrl) {
        if (fetchedPages >= maxPages) {
            break;
        }
        if (visited.has(currentUrl)) {
            break;
        }
        visited.add(currentUrl);
        const html = await browserGet(currentUrl);
        const $ = cheerio.load(html);
        for (const [id, product] of parseProductsFromPage($, currentUrl)) {
            products.set(id, product);
        }
        const nextUrl = getNextPageUrl($, currentUrl);
        if (!nextUrl || nextUrl === currentUrl || visited.has(nextUrl)) {
            break;
        }
        currentUrl = nextUrl;
        fetchedPages += 1;
    }
    return [...products.values()];
}
