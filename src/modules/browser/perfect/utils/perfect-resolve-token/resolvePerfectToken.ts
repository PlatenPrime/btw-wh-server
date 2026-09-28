import type { AxiosInstance } from "axios";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../../utils/merge-response-cookies/mergeResponseCookies.js";
import { BROWSER_TEXT_CONFIG } from "../perfect-ajax-post/perfectAjaxPost.js";
import { extractToken } from "../perfect-product-page-extract/perfectProductPageExtract.js";

export const PERFECT_CART_SHOW_URL =
  "https://perfectparty.in.ua/cart?action=show";

export async function resolvePerfectToken(
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
  return {
    token: extractToken(String(cartShowResp.data ?? "")),
    cookieHeader: merged,
  };
}
