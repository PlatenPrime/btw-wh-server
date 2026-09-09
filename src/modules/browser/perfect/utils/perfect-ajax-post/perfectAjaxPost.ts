import type { AxiosInstance } from "axios";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../../utils/merge-response-cookies/mergeResponseCookies.js";

export const PERFECT_CART_URL = "https://perfectparty.in.ua/cart";

export const BROWSER_TEXT_CONFIG = {
  responseType: "text" as const,
  transformResponse: [(data: unknown) => data],
  validateStatus: () => true,
};

const PERFECT_AJAX_POST_HEADERS = {
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Origin: "https://perfectparty.in.ua",
  "X-Requested-With": "XMLHttpRequest",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

export interface PerfectAjaxPostResult {
  status: number;
  data: string;
  cookieHeader: string;
}

export async function postPerfectAjax(
  client: AxiosInstance,
  url: string,
  formData: string,
  cookieHeader: string,
  referer: string
): Promise<PerfectAjaxPostResult> {
  const resp = await client.post<string>(url, formData, {
    ...BROWSER_TEXT_CONFIG,
    headers: {
      ...PERFECT_AJAX_POST_HEADERS,
      Referer: referer,
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
  });
  const headers = (resp as { headers?: Record<string, unknown> }).headers ?? {};
  return {
    status: (resp as { status?: number }).status ?? 0,
    data: String(resp.data ?? ""),
    cookieHeader: mergeCookies(
      cookieHeader,
      pickHeaderCaseInsensitive(headers, "set-cookie")
    ),
  };
}
