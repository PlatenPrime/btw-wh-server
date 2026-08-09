import * as cheerio from "cheerio";
import type { BrowserCheerioAPI } from "../../../utils/cheerioTypes.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import {
  GRABO_BASE_URL,
  type GraboSkuData,
} from "../types/graboSkuData.js";

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Текст атрибута: предпочитает `.selected`, иначе первый `li span`.
 */
function textFromAttribute(
  $: BrowserCheerioAPI,
  attributeSelector: string
): string {
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

function parseTags($: BrowserCheerioAPI): string[] {
  const tags: string[] = [];
  $(".attribute-tag1 .selected").each((_, el) => {
    const text = normalizeWhitespace($(el).text());
    if (text) {
      tags.push(text);
    }
  });
  return tags;
}

function parseImages($: BrowserCheerioAPI): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

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
export function parseGraboSkuHtml(html: string): GraboSkuData {
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
