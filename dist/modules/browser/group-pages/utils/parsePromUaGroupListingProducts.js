import { decodeHtmlEntities } from "../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
/**
 * Листинг группы Prom.ua (Balun, Yumi и т.п.): в наличии — кнопка «Купити» с data-product-*;
 * без наличия — карточка `product-block` с телефонами вместо кнопки.
 */
export function parsePromUaGroupListingProducts($, currentPageUrl) {
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
        const url = resolveHrefAgainstBase(rawUrl, currentPageUrl);
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
    $('li[data-qaid="product-block"][data-product-id]').each((_, el) => {
        const $card = $(el);
        const productId = $card.attr("data-product-id")?.trim();
        if (!productId || result.has(productId)) {
            return;
        }
        const $titleLink = $card.find("a.b-product-gallery__title").first();
        const $imgLink = $card.find("a.b-product-gallery__image-link").first();
        const href = $titleLink.attr("href")?.trim() ??
            $imgLink.attr("href")?.trim() ??
            "";
        const url = resolveHrefAgainstBase(href, currentPageUrl);
        if (!url) {
            return;
        }
        const titleFromText = $titleLink.text().trim();
        const titleFromAttr = $imgLink.attr("title")?.trim() ?? "";
        const rawTitle = titleFromText || titleFromAttr;
        const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
        if (!title) {
            return;
        }
        const $img = $imgLink.find("img").first();
        const rawImg = $img.attr("src")?.trim() ?? $img.attr("data-src")?.trim() ?? "";
        const imageUrl = resolveHrefAgainstBase(rawImg, currentPageUrl) ??
            (rawImg.startsWith("http") ? rawImg : null);
        if (!imageUrl) {
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
