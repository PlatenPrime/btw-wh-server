import * as cheerio from "cheerio";
import type { BrowserCheerio } from "../../../utils/cheerioTypes.js";
import { decodeHtmlEntities } from "../../../utils/decode-html-entities/decodeHtmlEntities.js";
import { resolveHrefAgainstBase } from "../../../utils/resolve-href-against-base/resolveHrefAgainstBase.js";
import { resolveLazyListingImage } from "../../../utils/resolve-lazy-listing-image/resolveLazyListingImage.js";
import { getNextPageUrlFromLinkRelNext } from "../../../group-pages/utils/crawlHtmlGroupListingPages.js";

export type AirGroupPageProduct = {
  productId: string;
  title: string;
  url: string;
  imageUrl: string;
};

export type ParseAirGroupListingPageResult = {
  products: AirGroupPageProduct[];
  nextPageUrl: string | null;
  hasListingMarkup: boolean;
};

const GRID_CARDS_SEL =
  "#us-category-products div.product-layout[data-pid], .us-category-products div.product-layout[data-pid]";
const GRID_SEL = "#us-category-products, .us-category-products";

function pickProductCards($: cheerio.CheerioAPI): BrowserCheerio {
  const fromGrid = $(GRID_CARDS_SEL);
  if (fromGrid.length > 0) {
    return fromGrid;
  }
  return $("#content div.product-layout[data-pid]");
}

/**
 * Карточки листинга Air из уже загруженного cheerio-документа.
 */
export function parseAirGroupListingProductsMap(
  $: cheerio.CheerioAPI,
  currentPageUrl: string
): Map<string, AirGroupPageProduct> {
  const result = new Map<string, AirGroupPageProduct>();

  pickProductCards($).each((_, el) => {
    const $card = $(el);
    const productId = $card.attr("data-pid")?.trim();
    if (!productId) {
      return;
    }

    const $img = $card.find(".us-module-img img").first();
    const imageUrl = $img.length
      ? resolveLazyListingImage($img, currentPageUrl, { preferDataSrc: true })
      : null;

    const $titleLink = $card.find(".us-module-title a").first();
    const rawTitle = $titleLink.text().trim();
    const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();

    const $imgLink = $card.find(".us-module-img a").first();
    const href =
      $imgLink.attr("href")?.trim() ?? $titleLink.attr("href")?.trim() ?? "";
    const url = resolveHrefAgainstBase(href, currentPageUrl);

    if (!title || !url || !imageUrl) {
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

export function hasAirGroupListingMarkup($: cheerio.CheerioAPI): boolean {
  return $(GRID_SEL).length > 0;
}

/**
 * Парсит HTML страницы категории Air: карточки, rel=next, признак сетки листинга.
 */
export function parseAirGroupListingPage(
  html: string,
  pageUrl: string
): ParseAirGroupListingPageResult {
  const $ = cheerio.load(html);
  const productsById = parseAirGroupListingProductsMap($, pageUrl);
  return {
    products: [...productsById.values()],
    nextPageUrl: getNextPageUrlFromLinkRelNext(
      $,
      pageUrl,
      resolveHrefAgainstBase
    ),
    hasListingMarkup: hasAirGroupListingMarkup($),
  };
}
