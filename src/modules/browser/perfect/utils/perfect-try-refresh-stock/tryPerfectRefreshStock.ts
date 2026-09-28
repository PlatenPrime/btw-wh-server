import type { AxiosInstance } from "axios";
import { logBrowserError } from "../../../utils/browserRequest.js";
import { postPerfectAjax } from "../perfect-ajax-post/perfectAjaxPost.js";
import { tryPerfectDataProductFallback } from "../perfect-data-product-fallback/perfectDataProductFallback.js";
import type { PerfectProductInfo } from "../perfect-per-piece-stock/perfectProductInfo.js";
import { extractProductDetailsHtmlFromRefreshResponse } from "../perfect-refresh-response/perfectRefreshResponse.js";

export async function tryPerfectRefreshStock(
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
    const detailsHtml = extractProductDetailsHtmlFromRefreshResponse(
      refreshResp.data
    );
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
