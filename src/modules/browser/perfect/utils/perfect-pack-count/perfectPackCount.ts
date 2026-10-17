import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

function extractPackCountFromTitle(title: string): number | null {
  if (!title) return null;
  const patterns = [/\((\d+)\s*шт\.?\)/i, /(\d+)\s*шт\.?/i];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (!match?.[1]) continue;
    const count = parseInt(match[1], 10);
    if (Number.isFinite(count) && count > 0) {
      return count;
    }
  }
  return null;
}

/** «Штук в упаковці: N» на карточке (укр.), если в названии нет «N шт». */
const PACK_COUNT_UK_HTML_REGEX = /Штук\s+в\s+упаковці\s*:\s*(\d+)/i;
const PACK_LABEL_UK_REGEX = /^Штук\s+в\s+упаковці$/i;

function parsePackCountFromText(text: string): number | null {
  const match = text.match(PACK_COUNT_UK_HTML_REGEX);
  if (!match?.[1]) return null;
  const count = parseInt(match[1], 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
}

function parsePositiveInt(text: string): number | null {
  const count = parseInt(text.trim(), 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count;
}

function firstPackFromElements($: CheerioAPI, elements: Cheerio<Element>): number | null {
  for (const el of elements.toArray()) {
    const count = parsePackCountFromText($(el).text());
    if (count !== null) return count;
  }
  return null;
}

/**
 * dt/th «Штук в упаковці» → соседний dd/td с числом
 * (вкладка характеристик, без склейки с описанием).
 */
function extractPackCountFromCharacteristics(
  $: CheerioAPI,
  scope: Cheerio<Element>,
): number | null {
  for (const labelEl of scope.find("dt, th").toArray()) {
    const label = $(labelEl).text().replace(/\s+/g, " ").trim();
    if (!PACK_LABEL_UK_REGEX.test(label)) continue;
    const valueEl = $(labelEl).next("dd, td");
    const count = parsePositiveInt(valueEl.text());
    if (count !== null) return count;
  }
  return null;
}

/**
 * Фасовка только у основного товара: узлы infoblock / характеристик в `#main`
 * без `.product-miniature` (не `$("#main").text()` — cheerio склеивает
 * «Штук в упаковці: 1» + «100 мл…» в «1100»).
 * Без `#main` — фрагменты/фикстуры: body минус miniatures.
 */
function extractPackCountFromProductHtml(html: string): number | null {
  const $ = cheerio.load(html);
  $(".product-miniature").remove();
  const main = $("#main").first();
  const scope = main.length ? main : $("body");

  const fromInfoblock = firstPackFromElements($, scope.find(".infoblock_pp, .infoblock_p"));
  if (fromInfoblock !== null) return fromInfoblock;

  const fromCharacteristics = extractPackCountFromCharacteristics($, scope);
  if (fromCharacteristics !== null) return fromCharacteristics;

  // Фикстуры и прочие одиночные узлы с полной фразой «Штук в упаковці: N».
  return firstPackFromElements($, scope.find("p, td, dd, li"));
}

export function resolvePackCount(title: string, html?: string): number | null {
  const fromTitle = extractPackCountFromTitle(title);
  if (fromTitle !== null) return fromTitle;
  if (html?.trim()) {
    return extractPackCountFromProductHtml(html);
  }
  return null;
}
