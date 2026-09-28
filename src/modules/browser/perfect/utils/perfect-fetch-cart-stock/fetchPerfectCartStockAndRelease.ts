import type { AxiosInstance } from "axios";
import {
  PERFECT_CART_URL,
  postPerfectAjax,
} from "../perfect-ajax-post/perfectAjaxPost.js";
import { deletePerfectCartItem } from "../perfect-cart-delete/deletePerfectCartItem.js";
import type { PerfectCartDeleteIds } from "../perfect-cart-response/perfectCartResponse.js";
import { parsePerfectCartStockOutcome } from "../perfect-parse-cart-stock-outcome/parsePerfectCartStockOutcome.js";
import type { PerfectProductInfo } from "../perfect-per-piece-stock/perfectProductInfo.js";
import { PERFECT_UNAVAILABLE_OUTCOME } from "../perfect-per-piece-stock/perfectProductInfo.js";
import { buildPerfectAddToCartBody } from "../perfect-product-page-extract/perfectProductPageExtract.js";
import { resolvePerfectCartFailure } from "../perfect-resolve-cart-failure/resolvePerfectCartFailure.js";

export async function fetchPerfectCartStockAndRelease(
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
  let outcome: PerfectProductInfo = PERFECT_UNAVAILABLE_OUTCOME;

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
      outcome = resolvePerfectCartFailure(params.html, params.pageTitle);
    } else {
      const parsed = parsePerfectCartStockOutcome(
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
