import * as cheerio from "cheerio";
import { browserGet } from "../../utils/browserRequest.js";

export interface YuminProductInfo {
  stock: number;
  price: number;
  title?: string;
}

const NEGATIVE_OUTCOME: YuminProductInfo = { stock: -1, price: -1 };

function parseNumberFromText(raw: string | undefined | null): number | null {
  if (!raw) {
    return null;
  }

  const cleaned = raw.replace(/[^\d,.\s]/g, "").replace(/\s+/g, "");
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.replace(/,/g, ".");
  const value = parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

/** Количество штук из фрагмента вида «(10шт)» / «(10 шт)» в названии товара */
export function extractPieceCountFromTitle(title: string): number | null {
  if (!title) {
    return null;
  }

  const parenMatch = title.match(/\((\d+)\s*шт\.?\)/i);
  if (parenMatch?.[1]) {
    const count = parseInt(parenMatch[1], 10);
    if (Number.isFinite(count) && count > 0) {
      return count;
    }
  }

  return null;
}

function parseWholesalePrices(html: string): number[] {
  const prices: number[] = [];
  const re =
    /Від\s+(\d+)\s*шт\.?\s*<\/p>\s*<p[^>]*>([^<]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const value = parseNumberFromText(m[2]);
    if (value !== null) {
      prices.push(value);
    }
  }
  return prices;
}

function parseCustomizableOptions(html: string): {
  initialPrice: number;
  flatQty: number;
} | null {
  const priceMatch = html.match(/:initial-price="([\d.]+)"/);
  const qtyMatch = html.match(/:flat-qty="(\d+)"/);
  if (!priceMatch?.[1] || !qtyMatch?.[1]) {
    return null;
  }

  const initialPrice = parseFloat(priceMatch[1]);
  const flatQty = parseInt(qtyMatch[1], 10);
  if (!Number.isFinite(initialPrice) || !Number.isFinite(flatQty) || flatQty < 0) {
    return null;
  }

  return { initialPrice, flatQty };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'");
}

/** Имя товара из JSON-LD (видимый h1 часто внутри text/x-template и недоступен cheerio). */
function parseLdJsonProductName($: cheerio.Root): string | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    const raw = $(scripts[i]).html();
    if (!raw) {
      continue;
    }
    try {
      const data = JSON.parse(raw.trim()) as { "@type"?: string; name?: string };
      if (data["@type"] === "Product" && typeof data.name === "string") {
        return data.name;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function pickTitle($: cheerio.Root): string {
  const h1 = $("h1.text-3xl").first().text().trim();
  if (h1) {
    return h1;
  }
  const og = $('meta[property="og:title"]').attr("content");
  if (og?.trim()) {
    return decodeHtmlEntities(og.trim());
  }
  return parseLdJsonProductName($) ?? "";
}

function pickNameForPieceCount($: cheerio.Root): string {
  const ld = parseLdJsonProductName($);
  if (ld?.trim()) {
    return ld.trim();
  }
  const h1 = $("h1.text-3xl").first().text().trim();
  if (h1) {
    return h1;
  }
  const og = $('meta[property="og:title"]').attr("content");
  if (og?.trim()) {
    return decodeHtmlEntities(og.trim());
  }
  return "";
}

/**
 * Парсит HTML страницы товара Yumin (yumi.market и совместимая вёрстка).
 * @returns { stock, price, title? }; при отсутствии обязательных данных — { stock: -1, price: -1 }
 */
export function parseYuminProductHtml(html: string): YuminProductInfo {
  if (!html || typeof html !== "string") {
    return NEGATIVE_OUTCOME;
  }

  const options = parseCustomizableOptions(html);
  if (!options) {
    return NEGATIVE_OUTCOME;
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
    price = Number((basePrice / pieceCount).toFixed(2));
    stock = options.flatQty * pieceCount;
  }

  return {
    stock,
    price,
    ...(title.length > 0 && { title }),
  };
}

/**
 * Получает данные о количестве (в штуках при наличии «(Nшт)» в названии) и цене за штуку со страницы товара.
 * @param link — URL страницы товара
 * @throws Error при пустом/не-строковом link
 */
export async function getYuminStockData(link: string): Promise<YuminProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  try {
    const html = await browserGet<string>(link);
    return parseYuminProductHtml(html);
  } catch {
    return NEGATIVE_OUTCOME;
  }
}
