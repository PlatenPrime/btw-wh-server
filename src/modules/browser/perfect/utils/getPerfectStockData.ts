import type { AxiosInstance } from "axios";
import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import { parseNumberLike } from "./parse-number-like/parseNumberLike.js";
import {
  BROWSER_TEXT_CONFIG,
  PERFECT_CART_URL,
  postPerfectAjax,
} from "./perfect-ajax-post/perfectAjaxPost.js";
import { deletePerfectCartItem } from "./perfect-cart-delete/deletePerfectCartItem.js";
import {
  parseCartResponse,
  parsePackPrice,
  resolvePerfectCartDeleteIds,
  type PerfectCartDeleteIds,
} from "./perfect-cart-response/perfectCartResponse.js";
import { tryPerfectDataProductFallback } from "./perfect-data-product-fallback/perfectDataProductFallback.js";
import { tryPerfectHtmlFallback } from "./perfect-html-fallback/perfectHtmlFallback.js";
import { isPerfectProductPageHtml } from "./perfect-product-page-detect/perfectProductPageDetect.js";
import type { PerfectProductInfo } from "./perfect-per-piece-stock/perfectProductInfo.js";
import { toStockAndPrice } from "./perfect-per-piece-stock/perfectPerPieceStock.js";
import {
  buildPerfectAddToCartBody,
  buildPerfectRefreshBody,
  extractProductAttributeId,
  extractProductGroupSelections,
  extractProductId,
  extractTitle,
  extractToken,
} from "./perfect-product-page-extract/perfectProductPageExtract.js";
import { extractProductDetailsHtmlFromRefreshResponse } from "./perfect-refresh-response/perfectRefreshResponse.js";

export type { PerfectProductInfo } from "./perfect-per-piece-stock/perfectProductInfo.js";

const PERFECT_CART_SHOW_URL = "https://perfectparty.in.ua/cart?action=show";

const UNAVAILABLE_OUTCOME: PerfectProductInfo = {
  stock: -1,
  price: -1,
  source: "unavailable",
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

async function resolvePerfectToken(
  client: AxiosInstance,
  html: string,
  cookieHeader: string
): Promise<{ token: string | null; cookieHeader: string }> {
  const fromHtml = extractToken(html);
  if (fromHtml) return { token: fromHtml, cookieHeader };

  const cartShowResp = await client.get<string>(PERFECT_CART_SHOW_URL, {
    ...BROWSER_TEXT_CONFIG,
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });
  const cartShowHeaders =
    (cartShowResp as { headers?: Record<string, unknown> }).headers ?? {};
  const merged = mergeCookies(
    cookieHeader,
    pickHeaderCaseInsensitive(cartShowHeaders, "set-cookie")
  );
  return { token: extractToken(String(cartShowResp.data ?? "")), cookieHeader: merged };
}

async function tryRefreshStock(
  client: AxiosInstance,
  productUrl: string,
  pageTitle: string,
  formData: string,
  cookieHeader: string
): Promise<{ info: PerfectProductInfo | null; cookieHeader: string }> {
  try {
    const refreshResp = await postPerfectAjax(
      client,
      productUrl,
      formData,
      cookieHeader,
      productUrl
    );
    if (refreshResp.status >= 400) {
      return { info: null, cookieHeader: refreshResp.cookieHeader };
    }
    const detailsHtml = extractProductDetailsHtmlFromRefreshResponse(refreshResp.data);
    if (!detailsHtml) {
      return { info: null, cookieHeader: refreshResp.cookieHeader };
    }
    const fromRefresh = tryPerfectDataProductFallback(detailsHtml, pageTitle);
    if (!fromRefresh) {
      return { info: null, cookieHeader: refreshResp.cookieHeader };
    }
    return {
      info: { ...fromRefresh, source: "refresh" },
      cookieHeader: refreshResp.cookieHeader,
    };
  } catch (error) {
    logBrowserError("Perfect product refresh failed:", error);
    return { info: null, cookieHeader };
  }
}

function parseCartStockOutcome(
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
    return { outcome: resolveCartFailure(html, pageTitle), deleteIds };
  }

  const stockPacksRaw = parseNumberLike(product.stock_quantity);
  const packPrice = parsePackPrice(product);
  if (stockPacksRaw === null || packPrice === null) {
    return { outcome: resolveCartFailure(html, pageTitle), deleteIds };
  }

  const stockPacks = Math.floor(stockPacksRaw);
  if (!Number.isFinite(stockPacks) || stockPacks < 0) {
    logUnavailableOutcome(productUrl, "invalid cart stock", htmlStatus, hasProductPageHtml);
    return { outcome: UNAVAILABLE_OUTCOME, deleteIds };
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

async function fetchCartStockAndRelease(
  client: AxiosInstance,
  params: {
    productUrl: string;
    html: string;
    pageTitle: string;
    token: string;
    idProduct: string;
    idProductAttribute: string | null;
    groupSelections: Record<string, string>;
    cookieHeader: string;
    htmlStatus: number;
    hasProductPageHtml: boolean;
  }
): Promise<PerfectProductInfo> {
  const addBody = buildPerfectAddToCartBody({
    token: params.token,
    idProduct: params.idProduct,
    idProductAttribute: params.idProductAttribute,
    groupSelections: params.groupSelections,
  });
  let deleteCookieHeader = params.cookieHeader;
  let deleteIds: PerfectCartDeleteIds = {
    idProduct: params.idProduct,
    idProductAttribute: params.idProductAttribute,
    idCustomization: "0",
  };
  let outcome: PerfectProductInfo = UNAVAILABLE_OUTCOME;

  try {
    const cartResp = await postPerfectAjax(
      client,
      PERFECT_CART_URL,
      addBody,
      params.cookieHeader,
      params.productUrl
    );
    deleteCookieHeader = cartResp.cookieHeader;
    if (cartResp.status >= 400) {
      outcome = resolveCartFailure(params.html, params.pageTitle);
    } else {
      const parsed = parseCartStockOutcome(
        cartResp.data,
        params.html,
        params.pageTitle,
        deleteIds,
        params.htmlStatus,
        params.hasProductPageHtml,
        params.productUrl
      );
      outcome = parsed.outcome;
      deleteIds = parsed.deleteIds;
    }
  } finally {
    await deletePerfectCartItem(client, {
      token: params.token,
      idProduct: deleteIds.idProduct,
      idProductAttribute: deleteIds.idProductAttribute,
      idCustomization: deleteIds.idCustomization,
      cookieHeader: deleteCookieHeader,
      productUrl: params.productUrl,
    });
  }

  return outcome;
}

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

    const productId = extractProductId(html, productUrl);
    if (!productId) {
      logUnavailableOutcome(productUrl, "id_product missing", htmlStatus, hasProductPageHtml);
      return UNAVAILABLE_OUTCOME;
    }

    const tokenResult = await resolvePerfectToken(client, html, cookieHeader);
    cookieHeader = tokenResult.cookieHeader;
    const token = tokenResult.token;
    if (!token) {
      logUnavailableOutcome(productUrl, "token missing", htmlStatus, hasProductPageHtml);
      return UNAVAILABLE_OUTCOME;
    }

    const idProductAttribute = extractProductAttributeId(html, productUrl);
    const groupSelections = extractProductGroupSelections(html);
    const productForm = {
      token,
      idProduct: productId,
      idProductAttribute,
      groupSelections,
    };

    const refreshResult = await tryRefreshStock(
      client,
      productUrl,
      pageTitle,
      buildPerfectRefreshBody(productForm),
      cookieHeader
    );
    cookieHeader = refreshResult.cookieHeader;
    if (refreshResult.info) return refreshResult.info;

    return await fetchCartStockAndRelease(client, {
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
    return UNAVAILABLE_OUTCOME;
  }
}
