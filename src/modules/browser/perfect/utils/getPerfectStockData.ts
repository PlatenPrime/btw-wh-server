import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import { BROWSER_TEXT_CONFIG } from "./perfect-ajax-post/perfectAjaxPost.js";
import { tryPerfectDataProductFallback } from "./perfect-data-product-fallback/perfectDataProductFallback.js";
import { fetchPerfectCartStockAndRelease } from "./perfect-fetch-cart-stock/fetchPerfectCartStockAndRelease.js";
import { tryPerfectHtmlFallback } from "./perfect-html-fallback/perfectHtmlFallback.js";
import { logPerfectUnavailableOutcome } from "./perfect-log-unavailable/logPerfectUnavailableOutcome.js";
import type { PerfectProductInfo } from "./perfect-per-piece-stock/perfectProductInfo.js";
import { PERFECT_UNAVAILABLE_OUTCOME } from "./perfect-per-piece-stock/perfectProductInfo.js";
import { isPerfectProductPageHtml } from "./perfect-product-page-detect/perfectProductPageDetect.js";
import {
  buildPerfectRefreshBody,
  extractProductAttributeId,
  extractProductGroupSelections,
  extractProductId,
  extractTitle,
} from "./perfect-product-page-extract/perfectProductPageExtract.js";
import { resolvePerfectToken } from "./perfect-resolve-token/resolvePerfectToken.js";
import { tryPerfectRefreshStock } from "./perfect-try-refresh-stock/tryPerfectRefreshStock.js";

export type { PerfectProductInfo } from "./perfect-per-piece-stock/perfectProductInfo.js";

/**
 * Остаток и цена perfectparty.in.ua.
 * Порядок: data-product на карточке → ajax refresh (без корзины) → add-to-cart с delete в той же сессии.
 */
export async function getPerfectStockData(link: string): Promise<PerfectProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();
  if (!productUrl) {
    throw new Error("Link is required and must be a string");
  }

  try {
    const client = getBrowserAxios();

    const htmlResponse = await client.get<string>(productUrl, BROWSER_TEXT_CONFIG);
    const html = String(htmlResponse.data ?? "");
    const htmlStatus = (htmlResponse as { status?: number }).status ?? 0;
    const hasProductPageHtml = isPerfectProductPageHtml(html);

    if (!html.trim()) {
      logPerfectUnavailableOutcome(productUrl, "empty body", htmlStatus, false);
      return PERFECT_UNAVAILABLE_OUTCOME;
    }

    if (!hasProductPageHtml && htmlStatus >= 400) {
      logPerfectUnavailableOutcome(
        productUrl,
        "not a product page",
        htmlStatus,
        false
      );
      return PERFECT_UNAVAILABLE_OUTCOME;
    }

    const htmlRespHeaders =
      (htmlResponse as { headers?: Record<string, unknown> }).headers ?? {};
    let cookieHeader = mergeCookies(
      "",
      pickHeaderCaseInsensitive(htmlRespHeaders, "set-cookie")
    );

    const pageTitle = extractTitle(html);

    const fromDataProduct = tryPerfectDataProductFallback(html, pageTitle);
    if (fromDataProduct) return fromDataProduct;

    const fromOosHtml = tryPerfectHtmlFallback(html, pageTitle);
    if (fromOosHtml) return fromOosHtml;

    const productId = extractProductId(html, productUrl);
    if (!productId) {
      logPerfectUnavailableOutcome(
        productUrl,
        "id_product missing",
        htmlStatus,
        hasProductPageHtml
      );
      return PERFECT_UNAVAILABLE_OUTCOME;
    }

    const tokenResult = await resolvePerfectToken(client, html, cookieHeader);
    cookieHeader = tokenResult.cookieHeader;
    const token = tokenResult.token;
    if (!token) {
      logPerfectUnavailableOutcome(
        productUrl,
        "token missing",
        htmlStatus,
        hasProductPageHtml
      );
      return PERFECT_UNAVAILABLE_OUTCOME;
    }

    const idProductAttribute = extractProductAttributeId(html, productUrl);
    const groupSelections = extractProductGroupSelections(html);
    const productForm = {
      token,
      idProduct: productId,
      idProductAttribute,
      groupSelections,
    };

    const refreshResult = await tryPerfectRefreshStock(
      client,
      productUrl,
      pageTitle,
      buildPerfectRefreshBody(productForm),
      cookieHeader
    );
    cookieHeader = refreshResult.cookieHeader;
    if (refreshResult.info) return refreshResult.info;

    return await fetchPerfectCartStockAndRelease(client, {
      productUrl,
      html,
      pageTitle,
      token,
      idProduct: productId,
      idProductAttribute,
      groupSelections,
      cookieHeader,
      htmlStatus,
      hasProductPageHtml,
    });
  } catch (error) {
    logBrowserError("Error fetching data from perfectparty product page:", error);
    return PERFECT_UNAVAILABLE_OUTCOME;
  }
}
