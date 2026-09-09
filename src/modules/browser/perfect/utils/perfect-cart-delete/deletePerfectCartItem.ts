import type { AxiosInstance } from "axios";
import { logBrowserError } from "../../../utils/browserRequest.js";
import {
  PERFECT_CART_URL,
  postPerfectAjax,
} from "../perfect-ajax-post/perfectAjaxPost.js";
import { buildPerfectDeleteFromCartBody } from "../perfect-product-page-extract/perfectProductPageExtract.js";

export async function deletePerfectCartItem(
  client: AxiosInstance,
  params: {
    token: string;
    idProduct: string;
    idProductAttribute: string | null;
    idCustomization: string;
    cookieHeader: string;
    productUrl: string;
  }
): Promise<void> {
  try {
    await postPerfectAjax(
      client,
      PERFECT_CART_URL,
      buildPerfectDeleteFromCartBody(params),
      params.cookieHeader,
      params.productUrl
    );
  } catch (error) {
    logBrowserError("Perfect cart delete failed:", error);
  }
}
