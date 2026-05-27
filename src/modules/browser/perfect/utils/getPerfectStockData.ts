import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import { parseNumberLike } from "./parse-number-like/parseNumberLike.js";
import { parseCartResponse, parsePackPrice } from "./perfect-cart-response/perfectCartResponse.js";
import { tryPerfectDataProductFallback } from "./perfect-data-product-fallback/perfectDataProductFallback.js";
import { tryPerfectHtmlFallback } from "./perfect-html-fallback/perfectHtmlFallback.js";
import { isPerfectProductPageHtml } from "./perfect-product-page-detect/perfectProductPageDetect.js";
import type { PerfectProductInfo } from "./perfect-per-piece-stock/perfectProductInfo.js";
import { toStockAndPrice } from "./perfect-per-piece-stock/perfectPerPieceStock.js";
import {
  buildPerfectAddToCartBody,
  extractProductAttributeId,
  extractProductGroupSelections,
  extractProductId,
  extractTitle,
  extractToken,
} from "./perfect-product-page-extract/perfectProductPageExtract.js";

export type { PerfectProductInfo } from "./perfect-per-piece-stock/perfectProductInfo.js";

const PERFECT_CART_URL = "https://perfectparty.in.ua/cart";
const PERFECT_CART_SHOW_URL = "https://perfectparty.in.ua/cart?action=show";

const UNAVAILABLE_OUTCOME: PerfectProductInfo = {
  stock: -1,
  price: -1,
  source: "unavailable",
};

const BROWSER_TEXT_CONFIG = {
  responseType: "text" as const,
  transformResponse: [(data: unknown) => data],
  validateStatus: () => true,
};

const PERFECT_CART_POST_HEADERS = {
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Origin: "https://perfectparty.in.ua",
  "X-Requested-With": "XMLHttpRequest",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

function logUnavailableOutcome(
  productUrl: string,
  reason: string,
  htmlStatus: number,
  hasProductPageHtml: boolean
): void {
  logBrowserError(
    `Perfect stock unavailable (${reason})`,
    new Error(
      `url=${productUrl} status=${htmlStatus} productPageHtml=${hasProductPageHtml}`
    )
  );
}

function resolveCartFailure(html: string, pageTitle: string): PerfectProductInfo {
  return (
    tryPerfectHtmlFallback(html, pageTitle) ??
    tryPerfectDataProductFallback(html, pageTitle) ??
    UNAVAILABLE_OUTCOME
  );
}

/**
 * Получает остаток и цену товара с perfectparty.in.ua.
 * Основной источник: data-product на карточке; корзина — только если data-product нет.
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
      logUnavailableOutcome(productUrl, "empty body", htmlStatus, false);
      return UNAVAILABLE_OUTCOME;
    }

    if (!hasProductPageHtml && htmlStatus >= 400) {
      logUnavailableOutcome(productUrl, "not a product page", htmlStatus, false);
      return UNAVAILABLE_OUTCOME;
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

    let token = extractToken(html);
    const productId = extractProductId(html, productUrl);
    if (!productId) {
      logUnavailableOutcome(productUrl, "id_product missing", htmlStatus, hasProductPageHtml);
      return UNAVAILABLE_OUTCOME;
    }

    if (!token) {
      const cartShowResp = await client.get<string>(PERFECT_CART_SHOW_URL, {
        ...BROWSER_TEXT_CONFIG,
        headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      });

      const cartShowHeaders =
        (cartShowResp as { headers?: Record<string, unknown> }).headers ?? {};
      cookieHeader = mergeCookies(
        cookieHeader,
        pickHeaderCaseInsensitive(cartShowHeaders, "set-cookie")
      );
      token = extractToken(String(cartShowResp.data ?? ""));
      if (!token) {
        logUnavailableOutcome(productUrl, "token missing", htmlStatus, hasProductPageHtml);
        return UNAVAILABLE_OUTCOME;
      }
    }

    const idProductAttribute = extractProductAttributeId(html, productUrl);
    const groupSelections = extractProductGroupSelections(html);
    const formData = buildPerfectAddToCartBody({
      token,
      idProduct: productId,
      idProductAttribute,
      groupSelections,
    });

    const cartResp = await client.post<string>(PERFECT_CART_URL, formData, {
      ...BROWSER_TEXT_CONFIG,
      headers: {
        ...PERFECT_CART_POST_HEADERS,
        Referer: productUrl,
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });

    const cartStatus = (cartResp as { status?: number }).status ?? 0;
    if (cartStatus >= 400) {
      return resolveCartFailure(html, pageTitle);
    }

    const cartData = parseCartResponse(String(cartResp.data ?? ""));
    const product = cartData?.cart?.products?.[0];
    if (!product) {
      return resolveCartFailure(html, pageTitle);
    }

    const stockPacksRaw = parseNumberLike(product.stock_quantity);
    const packPrice = parsePackPrice(product);
    if (stockPacksRaw === null || packPrice === null) {
      return resolveCartFailure(html, pageTitle);
    }

    const stockPacks = Math.floor(stockPacksRaw);
    if (!Number.isFinite(stockPacks) || stockPacks < 0) {
      logUnavailableOutcome(productUrl, "invalid cart stock", htmlStatus, hasProductPageHtml);
      return UNAVAILABLE_OUTCOME;
    }

    const title = (
      product.name ??
      product.embedded_attributes?.name ??
      pageTitle
    ).trim();

    return {
      ...toStockAndPrice(stockPacks, packPrice, title, html),
      source: "cart",
    };
  } catch (error) {
    logBrowserError("Error fetching data from perfectparty product page:", error);
    return UNAVAILABLE_OUTCOME;
  }
}
