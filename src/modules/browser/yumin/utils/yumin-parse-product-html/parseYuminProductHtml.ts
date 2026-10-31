import * as cheerio from "cheerio";
import { toMoney } from "../../../utils/to-money/toMoney.js";
import type { YuminProductInfo } from "../yumin-product-types/yuminProductInfo.js";
import { YUMIN_NEGATIVE_OUTCOME } from "../yumin-product-types/yuminProductInfo.js";
import { extractPieceCountFromTitle } from "../yumin-piece-count-from-title/extractPieceCountFromTitle.js";
import { parseCustomizableOptions } from "../yumin-customizable-options/yuminCustomizableOptions.js";
import { parseWholesalePrices } from "../yumin-wholesale-prices/yuminWholesalePrices.js";
import { pickNameForPieceCount, pickTitle } from "../yumin-pick-title/yuminPickTitle.js";

/**
 * Парсит HTML страницы товара Yumin (yumi.market и совместимая вёрстка).
 * @returns { stock, price, title? }; при отсутствии обязательных данных — { stock: -1, price: -1 }
 */
export function parseYuminProductHtml(html: string): YuminProductInfo {
  if (!html || typeof html !== "string") {
    return YUMIN_NEGATIVE_OUTCOME;
  }

  const options = parseCustomizableOptions(html);
  if (!options) {
    return YUMIN_NEGATIVE_OUTCOME;
  }

  const $ = cheerio.load(html);
  const title = pickTitle($);
  const pieceCount = extractPieceCountFromTitle(pickNameForPieceCount($));

  const wholesalePrices = parseWholesalePrices(html);
  let basePrice = options.initialPrice;
  if (wholesalePrices.length > 0) {
    basePrice = Math.min(options.initialPrice, ...wholesalePrices);
  }

  let stock = options.flatQty;
  let price = basePrice;

  if (pieceCount !== null && pieceCount > 0) {
    price = toMoney(basePrice / pieceCount);
    stock = options.flatQty * pieceCount;
  }

  const artikul = extractYuminArtikul($, html);

  return {
    stock,
    price,
    ...(title.length > 0 && { title }),
    ...(artikul && { artikul }),
  };
}

function extractYuminArtikul($: cheerio.CheerioAPI, html: string): string | undefined {
  let found: string | undefined;
  $("span").each((_, el) => {
    if (found) return;
    const $el = $(el);
    const text = $el.clone().children().remove().end().text().replace(/\s+/g, " ").trim();
    if (!/^Артикул:\s*$/i.test(text)) return;
    const next = $el.nextAll("span").first().text().replace(/\s+/g, " ").trim();
    if (next) found = next;
  });
  if (found) return found;

  const match = html.match(/Артикул:\s*<\/span>\s*<span[^>]*>\s*([^<]+?)\s*<\/span>/i);
  const fromHtml = match?.[1]?.replace(/\s+/g, " ").trim();
  return fromHtml || undefined;
}
