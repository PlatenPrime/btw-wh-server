import { fetchPromUaCompanySiteStock } from "../../promua/fetch-promua-company-site-stock/fetchPromUaCompanySiteStock.js";
import {
  BALUN_NEGATIVE_OUTCOME,
  BALUN_ORIGIN,
  type BalunProductInfo,
} from "./balun-product-types/balunProductInfo.js";
import { normalizeBalunOutcome } from "./balun-normalize-outcome/normalizeBalunOutcome.js";
import { parseBalunHtmlPrice } from "./parse-balun-html-price/parseBalunHtmlPrice.js";

export type { BalunProductInfo } from "./balun-product-types/balunProductInfo.js";
export { BALUN_ORIGIN } from "./balun-product-types/balunProductInfo.js";
export { parseBalunHtmlPrice } from "./parse-balun-html-price/parseBalunHtmlPrice.js";

type BalunHtmlContext = {
  htmlPrice: number | undefined;
};

/**
 * Остаток и цена карточки Balun.
 * Stock — GraphQL-кламп корзины (`recalculatedQuantity` при qty >> склада).
 * Price — `data-analytics.clerk.price_original`, иначе unit.selling из корзины.
 * Негативный исход — `{ stock: -1, price: -1 }`.
 */
export async function getBalunStockData(
  link: string
): Promise<BalunProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();
  if (!productUrl) {
    throw new Error("Link is required and must be a string");
  }

  return fetchPromUaCompanySiteStock<BalunHtmlContext, BalunProductInfo>({
    origin: BALUN_ORIGIN,
    productUrl,
    negativeOutcome: BALUN_NEGATIVE_OUTCOME,
    logLabel: "balun",
    parseHtmlContext: (html) => ({ htmlPrice: parseBalunHtmlPrice(html) }),
    resolveHtmlPrice: (ctx) => ctx.htmlPrice,
    normalizeOutcome: ({ quantity, unitPrice }) =>
      normalizeBalunOutcome(quantity, unitPrice),
  });
}
