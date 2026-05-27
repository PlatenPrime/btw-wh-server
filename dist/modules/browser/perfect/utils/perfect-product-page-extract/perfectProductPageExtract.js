import * as cheerio from "cheerio";
/** CSRF для add-to-cart: static_token из формы, не session token из prestashop.token. */
export function extractToken(html) {
    const formToken = html.match(/name=["']token["'][^>]*value=["']([a-f0-9]{32})["']/i);
    if (formToken?.[1])
        return formToken[1];
    const staticToken = html.match(/"static_token"\s*:\s*"([a-f0-9]{32})"/i);
    if (staticToken?.[1])
        return staticToken[1];
    const fallbackPatterns = [
        /\btoken=([a-f0-9]{32})\b/i,
        /"token"\s*:\s*"([a-f0-9]{32})"/i,
        /token:\s*"([a-f0-9]{32})"/i,
    ];
    for (const pattern of fallbackPatterns) {
        const match = html.match(pattern);
        if (match?.[1])
            return match[1];
    }
    return null;
}
export function extractProductId(html, productUrl) {
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
export function extractTitle(html) {
    const $ = cheerio.load(html);
    const h1 = $("h1").first().text().trim();
    if (h1)
        return h1;
    const og = $('meta[property="og:title"]').attr("content")?.trim();
    return og ?? "";
}
export function extractProductAttributeId(html, productUrl) {
    const idFromUrlMatch = productUrl.match(/\/(\d+)-(\d+)-[^/]+\.html(?:\?.*)?$/i);
    if (idFromUrlMatch?.[2])
        return idFromUrlMatch[2];
    const attrPatterns = [
        /"id_product_attribute"\s*:\s*(\d+)/,
        /id_product_attribute=(\d+)/i,
    ];
    for (const pattern of attrPatterns) {
        const match = html.match(pattern);
        if (match?.[1])
            return match[1];
    }
    return null;
}
/** Выбранные комбинации из формы add-to-cart: group[2] -> "5". */
export function extractProductGroupSelections(html) {
    const $ = cheerio.load(html);
    const form = $("#add-to-cart-or-refresh").first().length > 0
        ? $("#add-to-cart-or-refresh")
        : $('form[action*="/cart"]').first();
    const selections = {};
    form.find('input[name^="group["]:checked').each((_, el) => {
        const name = $(el).attr("name") ?? "";
        const groupMatch = name.match(/^group\[(\d+)\]$/);
        const value = $(el).attr("value")?.trim();
        if (groupMatch?.[1] && value) {
            selections[groupMatch[1]] = value;
        }
    });
    return selections;
}
export function buildPerfectAddToCartBody(params) {
    const body = new URLSearchParams({
        token: params.token,
        id_product: params.idProduct,
        id_customization: "0",
        qty: "1",
        add: "1",
        action: "update",
    });
    if (params.idProductAttribute) {
        body.set("id_product_attribute", params.idProductAttribute);
    }
    for (const [groupId, value] of Object.entries(params.groupSelections ?? {})) {
        body.set(`group[${groupId}]`, value);
    }
    return body.toString();
}
