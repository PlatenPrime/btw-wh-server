import * as cheerio from "cheerio";
import type {
  BrowserCheerio,
  BrowserCheerioAPI,
} from "../../../utils/cheerioTypes.js";
import { extractSvbumPackCount } from "../svbum-pack-count/extractSvbumPackCount.js";
import type { SvbumProductInfo } from "../svbum-product-types/svbumProductInfo.js";
import { SVBUM_NEGATIVE_OUTCOME } from "../svbum-product-types/svbumProductInfo.js";

type PackOffer = {
  packSize: number;
  qty: number;
  perPiece: number;
};

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

function parseAttrNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") {
    return null;
  }
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

function parseUnitPrice($el: BrowserCheerio): number | null {
  const special = parseAttrNumber($el.attr("data-special"));
  if (special !== null) {
    return special;
  }
  return parseAttrNumber($el.attr("data-price"));
}

function withTitle(
  result: { stock: number; price: number },
  title: string
): SvbumProductInfo {
  return title.length > 0 ? { ...result, title } : result;
}

function parseOptionOffers(
  $: BrowserCheerioAPI,
  $product: BrowserCheerio
): PackOffer[] {
  const offers: PackOffer[] = [];
  const inputs = $product.find(
    ".product-options-list input[type='radio'][data-option-quantity]"
  );

  inputs.each((_, el) => {
    const $input = $(el);
    const qty = parseAttrNumber($input.attr("data-option-quantity"));
    if (qty === null || qty < 0 || !Number.isInteger(qty)) {
      return;
    }

    const unitPrice = parseUnitPrice($input);
    if (unitPrice === null) {
      return;
    }

    const name = $input
      .closest("label")
      .find(".product-option--name")
      .first()
      .text();
    const packSize = extractSvbumPackCount(name) ?? 1;
    offers.push({
      packSize,
      qty,
      perPiece: unitPrice / packSize,
    });
  });

  return offers;
}

function parseFromOptions(
  offers: PackOffer[],
  title: string
): SvbumProductInfo {
  if (offers.length === 0) {
    return SVBUM_NEGATIVE_OUTCOME;
  }

  const inStock = offers.filter((offer) => offer.qty > 0);
  const priced = inStock.length > 0 ? inStock : offers;
  const price = toMoney(Math.min(...priced.map((offer) => offer.perPiece)));
  const stock = inStock.reduce(
    (sum, offer) => sum + offer.qty * offer.packSize,
    0
  );

  return withTitle({ stock, price }, title);
}

function parseSimpleProduct(
  $product: BrowserCheerio,
  title: string
): SvbumProductInfo {
  const qty = parseAttrNumber(
    $product.find("input[data-product-quantity]").first().attr("data-product-quantity")
  );
  if (qty === null || qty < 0 || !Number.isInteger(qty)) {
    return SVBUM_NEGATIVE_OUTCOME;
  }

  const $priceNew = $product.find(".product-control-price .price-new").first();
  const special = parseAttrNumber(
    $priceNew.find("[data-special]").first().attr("data-special")
  );
  const regular = parseAttrNumber(
    $priceNew.find("[data-price]").first().attr("data-price")
  );
  const unitPrice = special ?? regular;
  if (unitPrice === null) {
    return SVBUM_NEGATIVE_OUTCOME;
  }

  const packCount = extractSvbumPackCount(title);
  if (packCount !== null && packCount > 0) {
    return withTitle(
      {
        stock: qty * packCount,
        price: toMoney(unitPrice / packCount),
      },
      title
    );
  }

  return withTitle({ stock: qty, price: toMoney(unitPrice) }, title);
}

/**
 * Парсит HTML карточки sviatobum.ua: цена за штуку и остаток в штуках из `#product`.
 * JSON-LD и блоки рекомендаций игнорируются.
 */
export function parseSvbumProductHtml(html: string): SvbumProductInfo {
  if (!html || typeof html !== "string") {
    return SVBUM_NEGATIVE_OUTCOME;
  }

  const $ = cheerio.load(html);
  const $product = $("#product").first();
  if ($product.length === 0) {
    return SVBUM_NEGATIVE_OUTCOME;
  }

  const title = $("h1.page-title").first().text().trim();
  const offers = parseOptionOffers($, $product);
  if (offers.length > 0) {
    return parseFromOptions(offers, title);
  }

  return parseSimpleProduct($product, title);
}
