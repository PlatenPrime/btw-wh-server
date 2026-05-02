import type { PerfectProductInfo } from "../perfect-per-piece-stock/perfectProductInfo.js";
import {
  extractDisplayPriceFromProductHtml,
  isPerfectProductPageOutOfStock,
} from "../perfect-product-page-price/perfectProductPagePrice.js";
import { toStockAndPrice } from "../perfect-per-piece-stock/perfectPerPieceStock.js";

export function tryPerfectHtmlFallback(
  html: string,
  pageTitle: string
): PerfectProductInfo | null {
  if (!isPerfectProductPageOutOfStock(html)) return null;
  const packPrice = extractDisplayPriceFromProductHtml(html);
  if (packPrice === null) return null;
  const title = pageTitle.trim();
  return toStockAndPrice(0, packPrice, title, html);
}
