import * as cheerio from "cheerio";
import type { SharikProductRestsItem } from "./types.js";

/** Формат строки: `1501-3445 = 7; 509.60` */
const PRODUCT_RESTS_LINE_RE = /^(\S+)\s*=\s*(\d+)\s*;\s*([\d.]+)\s*$/;

/**
 * Парсит HTML страницы sharik.ua/product_rests/{seed}/.
 * Каждый артикул в `<pre>`. При дубликатах побеждает последняя строка.
 */
export function parseSharikProductRestsHtml(
  html: string
): Map<string, SharikProductRestsItem> {
  const map = new Map<string, SharikProductRestsItem>();
  const $ = cheerio.load(html);

  $("pre").each((_, el) => {
    const text = $(el).text().trim();
    const match = text.match(PRODUCT_RESTS_LINE_RE);
    if (!match) {
      return;
    }

    const artikul = match[1];
    const quantity = parseInt(match[2], 10);
    const price = parseFloat(match[3]);

    if (Number.isNaN(quantity) || Number.isNaN(price)) {
      return;
    }

    map.set(artikul, { quantity, price });
  });

  return map;
}
