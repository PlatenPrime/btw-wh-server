import { parseNumberLike } from "../parse-number-like/parseNumberLike.js";
import {
  parseCartResponse,
  parsePackPrice,
  resolvePerfectCartDeleteIds,
  type PerfectCartDeleteIds,
} from "../perfect-cart-response/perfectCartResponse.js";
import { logPerfectUnavailableOutcome } from "../perfect-log-unavailable/logPerfectUnavailableOutcome.js";
import type { PerfectProductInfo } from "../perfect-per-piece-stock/perfectProductInfo.js";
import { PERFECT_UNAVAILABLE_OUTCOME } from "../perfect-per-piece-stock/perfectProductInfo.js";
import { toStockAndPrice } from "../perfect-per-piece-stock/perfectPerPieceStock.js";
import { resolvePerfectCartFailure } from "../perfect-resolve-cart-failure/resolvePerfectCartFailure.js";

export function parsePerfectCartStockOutcome(
  cartRaw: string,
  html: string,
  pageTitle: string,
  fallbackIds: PerfectCartDeleteIds,
  htmlStatus: number,
  hasProductPageHtml: boolean,
  productUrl: string
): { outcome: PerfectProductInfo; deleteIds: PerfectCartDeleteIds } {
  const cartData = parseCartResponse(cartRaw);
  const product = cartData?.cart?.products?.[0];
  const deleteIds = resolvePerfectCartDeleteIds(product, fallbackIds);
  if (!product) {
    return { outcome: resolvePerfectCartFailure(html, pageTitle), deleteIds };
  }

  const stockPacksRaw = parseNumberLike(product.stock_quantity);
  const packPrice = parsePackPrice(product);
  if (stockPacksRaw === null || packPrice === null) {
    return { outcome: resolvePerfectCartFailure(html, pageTitle), deleteIds };
  }

  const stockPacks = Math.floor(stockPacksRaw);
  if (!Number.isFinite(stockPacks) || stockPacks < 0) {
    logPerfectUnavailableOutcome(
      productUrl,
      "invalid cart stock",
      htmlStatus,
      hasProductPageHtml
    );
    return { outcome: PERFECT_UNAVAILABLE_OUTCOME, deleteIds };
  }

  const title = (
    product.name ??
    product.embedded_attributes?.name ??
    pageTitle
  ).trim();

  return {
    outcome: {
      ...toStockAndPrice(stockPacks, packPrice, title, html),
      source: "cart",
    },
    deleteIds,
  };
}
