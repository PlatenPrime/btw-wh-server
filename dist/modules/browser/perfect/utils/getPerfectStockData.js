import * as cheerio from "cheerio";
import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
const PERFECT_CART_URL = "https://perfectparty.in.ua/cart";
const PERFECT_CART_SHOW_URL = "https://perfectparty.in.ua/cart?action=show";
const NEGATIVE_OUTCOME = { stock: -1, price: -1 };
const PRICE_TEXT_REGEX = /([\d\s,.]+)/;
function parseNumberLike(value) {
    if (typeof value === "number") {
        if (Number.isFinite(value) && value >= 0)
            return value;
        return null;
    }
    if (typeof value !== "string")
        return null;
    const cleaned = value.replace(/\u00a0/g, " ").trim();
    if (!cleaned)
        return null;
    const match = cleaned.match(PRICE_TEXT_REGEX);
    if (!match?.[1])
        return null;
    const normalized = match[1].replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    if (!Number.isFinite(parsed) || parsed < 0)
        return null;
    return parsed;
}
function extractPackCountFromTitle(title) {
    if (!title)
        return null;
    const patterns = [/\((\d+)\s*шт\.?\)/i, /(\d+)\s*шт\.?/i];
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (!match?.[1])
            continue;
        const count = parseInt(match[1], 10);
        if (Number.isFinite(count) && count > 0) {
            return count;
        }
    }
    return null;
}
/** «Штук в упаковці: N» на карточке (укр.), если в названии нет «N шт». */
const PACK_COUNT_UK_HTML_REGEX = /Штук\s+в\s+упаковці\s*:\s*(\d+)/i;
function extractPackCountFromProductHtml(html) {
    const match = html.match(PACK_COUNT_UK_HTML_REGEX);
    if (!match?.[1])
        return null;
    const count = parseInt(match[1], 10);
    if (!Number.isFinite(count) || count <= 0)
        return null;
    return count;
}
function resolvePackCount(title, html) {
    const fromTitle = extractPackCountFromTitle(title);
    if (fromTitle !== null)
        return fromTitle;
    if (html?.trim()) {
        return extractPackCountFromProductHtml(html);
    }
    return null;
}
function extractToken(html) {
    const tokenPatterns = [
        /token:\s*"([a-z0-9]{16,})"/i,
        /"token"\s*:\s*"([a-z0-9]{16,})"/i,
        /\btoken=([a-z0-9]{16,})\b/i,
        /name=["']token["'][^>]*value=["']([a-z0-9]{16,})["']/i,
    ];
    for (const pattern of tokenPatterns) {
        const match = html.match(pattern);
        if (match?.[1])
            return match[1];
    }
    return null;
}
function extractProductId(html, productUrl) {
    const idFromUrlMatch = productUrl.match(/\/(\d+)-[^/]+\.html(?:\?.*)?$/i);
    if (idFromUrlMatch?.[1])
        return idFromUrlMatch[1];
    const idPatterns = [/"item_id":"(\d+)"/, /"id_product":"(\d+)"/];
    for (const pattern of idPatterns) {
        const match = html.match(pattern);
        if (match?.[1])
            return match[1];
    }
    return null;
}
function extractTitle(html) {
    const $ = cheerio.load(html);
    const h1 = $("h1").first().text().trim();
    if (h1)
        return h1;
    const og = $('meta[property="og:title"]').attr("content")?.trim();
    return og ?? "";
}
function parseCartResponse(raw) {
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
function pickHeaderCaseInsensitive(headers, key) {
    const wanted = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === wanted)
            return v;
    }
    return undefined;
}
function parseSetCookieHeader(setCookie) {
    if (Array.isArray(setCookie)) {
        return setCookie.filter((item) => typeof item === "string");
    }
    if (typeof setCookie === "string") {
        return [setCookie];
    }
    return [];
}
function mergeCookies(existingCookieHeader, setCookie) {
    const cookieMap = new Map();
    if (existingCookieHeader.trim()) {
        const parts = existingCookieHeader.split(";");
        for (const part of parts) {
            const pair = part.trim();
            if (!pair)
                continue;
            const eq = pair.indexOf("=");
            if (eq <= 0)
                continue;
            const name = pair.slice(0, eq).trim();
            const value = pair.slice(eq + 1).trim();
            if (name)
                cookieMap.set(name, value);
        }
    }
    const setCookieRows = parseSetCookieHeader(setCookie);
    for (const row of setCookieRows) {
        const firstPart = row.split(";")[0]?.trim() ?? "";
        if (!firstPart)
            continue;
        const eq = firstPart.indexOf("=");
        if (eq <= 0)
            continue;
        const name = firstPart.slice(0, eq).trim();
        const value = firstPart.slice(eq + 1).trim();
        if (name)
            cookieMap.set(name, value);
    }
    return [...cookieMap.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}
function parsePackPrice(product) {
    const direct = parseNumberLike(product.price_without_reduction);
    if (direct !== null)
        return direct;
    const embeddedDirect = parseNumberLike(product.embedded_attributes?.price_without_reduction);
    if (embeddedDirect !== null)
        return embeddedDirect;
    const embeddedText = parseNumberLike(product.embedded_attributes?.price);
    if (embeddedText !== null)
        return embeddedText;
    return parseNumberLike(product.price);
}
/** Остаток в штуках и цена за штуку, если известна фасовка из title или блока «Штук в упаковці» в HTML. */
function toStockAndPrice(stockPacks, packPrice, title, html) {
    const packCount = resolvePackCount(title, html);
    if (!packCount) {
        return {
            stock: stockPacks,
            price: packPrice,
            ...(title && { title }),
        };
    }
    return {
        stock: stockPacks * packCount,
        price: Number((packPrice / packCount).toFixed(2)),
        ...(title && { title }),
    };
}
function extractDisplayPriceFromProductHtml(html) {
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
function isPerfectProductPageOutOfStock(html) {
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
function tryPerfectHtmlFallback(html, pageTitle) {
    if (!isPerfectProductPageOutOfStock(html))
        return null;
    const packPrice = extractDisplayPriceFromProductHtml(html);
    if (packPrice === null)
        return null;
    const title = pageTitle.trim();
    return toStockAndPrice(0, packPrice, title, html);
}
/**
 * Получает остаток и цену товара с perfectparty.in.ua через запрос add-to-cart в корзину.
 * Фасовка: «N шт» в названии или «Штук в упаковці: N» на странице — тогда остаток в штуках и цена за штуку.
 * Если товар не попадает в ответ корзины (часто «розпродано»), подставляет цену и остаток 0 с HTML карточки.
 */
export async function getPerfectStockData(link) {
    if (!link || typeof link !== "string") {
        throw new Error("Link is required and must be a string");
    }
    const productUrl = link.trim();
    if (!productUrl) {
        throw new Error("Link is required and must be a string");
    }
    try {
        const client = getBrowserAxios();
        const htmlResponse = await client.get(productUrl, {
            responseType: "text",
            transformResponse: [(data) => data],
        });
        const html = String(htmlResponse.data ?? "");
        if (!html.trim())
            return NEGATIVE_OUTCOME;
        const htmlRespHeaders = htmlResponse.headers ?? {};
        let cookieHeader = mergeCookies("", pickHeaderCaseInsensitive(htmlRespHeaders, "set-cookie"));
        let token = extractToken(html);
        const productId = extractProductId(html, productUrl);
        if (!productId)
            return NEGATIVE_OUTCOME;
        // На части страниц token не встроен в HTML карточки, но есть на странице корзины.
        if (!token) {
            const cartShowResp = await client.get(PERFECT_CART_SHOW_URL, {
                headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
                responseType: "text",
                transformResponse: [(data) => data],
            });
            const cartShowHeaders = cartShowResp.headers ?? {};
            cookieHeader = mergeCookies(cookieHeader, pickHeaderCaseInsensitive(cartShowHeaders, "set-cookie"));
            token = extractToken(String(cartShowResp.data ?? ""));
            if (!token)
                return NEGATIVE_OUTCOME;
        }
        const pageTitle = extractTitle(html);
        const formData = new URLSearchParams({
            token,
            id_product: productId,
            id_customization: "0",
            qty: "1",
            first_name: "",
            last_name: "",
            phone: "",
            email: "",
            id_country: "216",
            id_toc_state: "325",
            city: "",
            address: "",
            add: "1",
            action: "update",
        });
        const cartResp = await client.post(PERFECT_CART_URL, formData.toString(), {
            headers: {
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Origin: "https://perfectparty.in.ua",
                Referer: productUrl,
                "X-Requested-With": "XMLHttpRequest",
                ...(cookieHeader && { Cookie: cookieHeader }),
            },
            responseType: "text",
            transformResponse: [(data) => data],
        });
        const cartData = parseCartResponse(String(cartResp.data ?? ""));
        const product = cartData?.cart?.products?.[0];
        if (!product) {
            return tryPerfectHtmlFallback(html, pageTitle) ?? NEGATIVE_OUTCOME;
        }
        const stockPacksRaw = parseNumberLike(product.stock_quantity);
        const packPrice = parsePackPrice(product);
        if (stockPacksRaw === null || packPrice === null) {
            return tryPerfectHtmlFallback(html, pageTitle) ?? NEGATIVE_OUTCOME;
        }
        const stockPacks = Math.floor(stockPacksRaw);
        if (!Number.isFinite(stockPacks) || stockPacks < 0)
            return NEGATIVE_OUTCOME;
        const title = (product.name ??
            product.embedded_attributes?.name ??
            pageTitle).trim();
        return toStockAndPrice(stockPacks, packPrice, title, html);
    }
    catch (error) {
        logBrowserError("Error fetching data from perfectparty product page:", error);
        return NEGATIVE_OUTCOME;
    }
}
