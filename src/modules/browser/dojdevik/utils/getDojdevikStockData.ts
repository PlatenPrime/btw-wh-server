import * as cheerio from "cheerio";
import { fetchPromUaCompanySiteStock } from "../../promua/fetch-promua-company-site-stock/fetchPromUaCompanySiteStock.js";
import {
  parseDojdevikPackagePriceFromDom,
  parseDojdevikTitleFromDom,
} from "./dojdevik-product-price-from-dom/parseDojdevikPackagePriceFromDom.js";
import type { DojdevikProductInfo } from "./dojdevik-product-types/dojdevikProductInfo.js";
import { DOJDEVIK_NEGATIVE_OUTCOME } from "./dojdevik-product-types/dojdevikProductInfo.js";
import { extractDojdevikPackCount } from "./extract-dojdevik-pack-count/extractDojdevikPackCount.js";
import { normalizeDojdevikOutcome } from "./dojdevik-normalize-outcome/normalizeDojdevikOutcome.js";

export type { DojdevikProductInfo } from "./dojdevik-product-types/dojdevikProductInfo.js";

export const DOJDEVIK_ORIGIN = "https://dojdevik.com.ua";

type DojdevikHtmlContext = {
  title: string;
  packSize: number;
  htmlPackagePrice: number | null;
};

/**
 * Остаток и цена карточки dojdevik (Prom company site).
 * Stock — GraphQL clamp упаковок × packSize (штуки).
 * Price — цена упаковки / packSize (2 знака).
 * Негативный исход — `{ stock: -1, price: -1 }`.
 */
export async function getDojdevikStockData(
  link: string
): Promise<DojdevikProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();
  if (!productUrl) {
    throw new Error("Link is required and must be a string");
  }

  return fetchPromUaCompanySiteStock<DojdevikHtmlContext, DojdevikProductInfo>({
    origin: DOJDEVIK_ORIGIN,
    productUrl,
    negativeOutcome: DOJDEVIK_NEGATIVE_OUTCOME,
    logLabel: "dojdevik",
    parseHtmlContext: (html) => {
      const $ = cheerio.load(html);
      return {
        title: parseDojdevikTitleFromDom($),
        packSize: extractDojdevikPackCount(html),
        htmlPackagePrice: parseDojdevikPackagePriceFromDom($),
      };
    },
    resolveHtmlPrice: (ctx) => ctx.htmlPackagePrice,
    normalizeOutcome: ({ quantity, unitPrice, ctx }) =>
      normalizeDojdevikOutcome(
        quantity,
        unitPrice,
        ctx.packSize,
        ctx.title
      ),
  });
}
