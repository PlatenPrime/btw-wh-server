import { tryPerfectDataProductFallback } from "../perfect-data-product-fallback/perfectDataProductFallback.js";
import { tryPerfectHtmlFallback } from "../perfect-html-fallback/perfectHtmlFallback.js";
import type { PerfectProductInfo } from "../perfect-per-piece-stock/perfectProductInfo.js";
import { PERFECT_UNAVAILABLE_OUTCOME } from "../perfect-per-piece-stock/perfectProductInfo.js";

export function resolvePerfectCartFailure(
  html: string,
  pageTitle: string
): PerfectProductInfo {
  return (
    tryPerfectHtmlFallback(html, pageTitle) ??
    tryPerfectDataProductFallback(html, pageTitle) ??
    PERFECT_UNAVAILABLE_OUTCOME
  );
}
