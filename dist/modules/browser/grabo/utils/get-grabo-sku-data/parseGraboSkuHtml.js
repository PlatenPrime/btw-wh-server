import * as cheerio from "cheerio";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { GRABO_BASE_URL, } from "../types/graboSkuData.js";
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
/**
 * Текст атрибута: предпочитает `.selected`, иначе первый `li span`.
 */
function textFromAttribute($, attributeSelector) {
    const root = $(attributeSelector).first();
    if (root.length === 0) {
        return "";
    }
    const selected = root.find(".selected").first();
    if (selected.length > 0) {
        return normalizeWhitespace(selected.text());
    }
    const firstSpan = root.find("li span").first();
    if (firstSpan.length === 0) {
        return "";
    }
    return normalizeWhitespace(firstSpan.text());
}
function parseTags($) {
    const tags = [];
    $(".attribute-tag1 .selected").each((_, el) => {
        const text = normalizeWhitespace($(el).text());
        if (text) {
            tags.push(text);
        }
    });
    return tags;
}
function parseImages($) {
    const images = [];
    const seen = new Set();
    $("ul.product-gallery a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) {
            return;
        }
        const absolute = resolveHrefAgainstBase(href, GRABO_BASE_URL);
        if (!absolute || seen.has(absolute)) {
            return;
        }
        seen.add(absolute);
        images.push(absolute);
    });
    return images;
}
/**
 * Парсит HTML карточки товара Grabo в объект полей GraboSkuData.
 * Без сетевых запросов. Variations не учитываются.
 */
export function parseGraboSkuHtml(html) {
    const $ = cheerio.load(html);
    return {
        title: normalizeWhitespace($("h1.title").first().text()),
        productId: normalizeWhitespace($(".product-code").first().text()),
        isNew: $(".link-novita, .novita").length > 0,
        color: textFromAttribute($, ".attribute-color"),
        size: textFromAttribute($, ".attribute-size"),
        material: textFromAttribute($, ".attribute-material"),
        gas: textFromAttribute($, ".attribute-gas"),
        language: textFromAttribute($, ".attribute-language"),
        gasCapacity: textFromAttribute($, ".attribute-gascapacity"),
        tag: parseTags($),
        images: parseImages($),
    };
}
