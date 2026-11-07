import * as cheerio from "cheerio";
import type { BrowserCheerio, BrowserCheerioAPI } from "../../../utils/cheerioTypes.js";
import { toMoney } from "../../../utils/to-money/toMoney.js";
import { extractPartymallPackCount } from "../partymall-pack-count/extractPartymallPackCount.js";
import type { PartymallProductInfo } from "../partymall-product-types/partymallProductInfo.js";
import { PARTYMALL_NEGATIVE_OUTCOME } from "../partymall-product-types/partymallProductInfo.js";

function withMeta(
  result: { stock: number; price: number },
  title: string,
  artikul: string | undefined,
): PartymallProductInfo {
  let out: PartymallProductInfo = result;
  if (title.length > 0) {
    out = { ...out, title };
  }
  if (artikul) {
    out = { ...out, artikul };
  }
  return out;
}

function extractArtikul($: BrowserCheerioAPI, $product: BrowserCheerio): string | undefined {
  const fromDom = $product
    .find('span[id^="product-model-"]')
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  if (fromDom) {
    return fromDom;
  }

  let fromJsonLd: string | undefined;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (fromJsonLd) {
      return;
    }
    const raw = $(el).html()?.trim();
    if (!raw) {
      return;
    }
    try {
      const data = JSON.parse(raw) as { "@type"?: string; sku?: unknown };
      if (data?.["@type"] !== "Product") {
        return;
      }
      if (typeof data.sku === "string" && data.sku.trim()) {
        fromJsonLd = data.sku.trim();
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });
  return fromJsonLd;
}

function parsePriceText(raw: string): number | null {
  const normalized = raw.replace(/\s+/g, " ").replace(",", ".").trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match?.[1]) {
    return null;
  }
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseStock($product: BrowserCheerio): number | null {
  const $stock = $product.find(".ds-product-main-stock").first();
  if ($stock.length === 0) {
    return null;
  }
  const text = $stock.text().replace(/\s+/g, " ").trim();
  const isOos =
    $stock.hasClass("red-text") ||
    /немає\s+в\s+наявності/i.test(text) ||
    /нет\s+в\s+наличии/i.test(text);

  const match = text.match(/(\d+)\s*$/) ?? text.match(/:\s*(\d+)/);
  if (match?.[1]) {
    const qty = parseInt(match[1], 10);
    if (Number.isFinite(qty) && qty >= 0) {
      return isOos ? 0 : qty;
    }
  }

  if (isOos) {
    return 0;
  }
  return null;
}

/**
 * Парсит HTML карточки partymall.ua: цена за штуку и остаток в штуках.
 * Pack attr делит цену и умножает stock. Wholesale tiers игнорируются.
 */
export function parsePartymallProductHtml(html: string): PartymallProductInfo {
  if (!html || typeof html !== "string") {
    return PARTYMALL_NEGATIVE_OUTCOME;
  }

  const $ = cheerio.load(html);
  const $product = $("#product").first();
  if ($product.length === 0) {
    return PARTYMALL_NEGATIVE_OUTCOME;
  }

  const title =
    $product.find("h1").first().text().replace(/\s+/g, " ").trim() ||
    $(".ds-page-title h1").first().text().replace(/\s+/g, " ").trim();

  const artikul = extractArtikul($, $product);
  const stock = parseStock($product);
  if (stock === null) {
    return PARTYMALL_NEGATIVE_OUTCOME;
  }

  const packagePrice = parsePriceText(
    $product.find(".ds-product-main-price .ds-price-new").first().text(),
  );
  if (packagePrice === null) {
    return PARTYMALL_NEGATIVE_OUTCOME;
  }

  const packCount = extractPartymallPackCount($);
  const factor = packCount !== null && packCount > 0 ? packCount : 1;
  const price = toMoney(packagePrice / factor);
  const pieceStock = stock * factor;

  return withMeta({ stock: pieceStock, price }, title, artikul);
}
