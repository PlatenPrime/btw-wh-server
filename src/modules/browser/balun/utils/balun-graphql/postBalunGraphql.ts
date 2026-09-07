import type { AxiosInstance } from "axios";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../../utils/merge-response-cookies/mergeResponseCookies.js";

export const BALUN_ORIGIN = "https://balun.com.ua";

export const BROWSER_TEXT_CONFIG = {
  responseType: "text" as const,
  transformResponse: [(data: unknown) => data],
  validateStatus: () => true,
};

export type PostBalunGraphqlInput = {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
  productUrl: string;
  cookieHeader: string;
  csrfToken?: string;
};

export type PostBalunGraphqlResult = {
  status: number;
  body: unknown;
  cookieHeader: string;
};

/**
 * URL Prom GraphQL на company site Balun.
 */
export function buildBalunGraphqlUrl(operationName: string): string {
  const params = new URLSearchParams({
    operation_name: operationName,
    source: "COMPANY_SITE",
  });
  return `${BALUN_ORIGIN}/bfg/graphql?${params.toString()}`;
}

function buildGraphqlHeaders(
  productUrl: string,
  cookieHeader: string,
  csrfToken: string | undefined
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Origin: BALUN_ORIGIN,
    Referer: productUrl,
    "X-Language": "uk",
    "X-Web-Device": "desktop",
    "X-Requested-With": "XMLHttpRequest",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  };
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    headers["x-csrftoken"] = csrfToken;
  }
  return headers;
}

/**
 * POST в `/bfg/graphql` с cookie jar и опциональным CSRF.
 */
export async function postBalunGraphql(
  client: AxiosInstance,
  input: PostBalunGraphqlInput
): Promise<PostBalunGraphqlResult> {
  const url = buildBalunGraphqlUrl(input.operationName);
  const response = await client.post(
    url,
    {
      operationName: input.operationName,
      variables: input.variables,
      query: input.query,
    },
    {
      ...BROWSER_TEXT_CONFIG,
      headers: buildGraphqlHeaders(
        input.productUrl,
        input.cookieHeader,
        input.csrfToken
      ),
    }
  );

  const cookieHeader = mergeCookies(
    input.cookieHeader,
    pickHeaderCaseInsensitive(
      (response as { headers?: Record<string, unknown> }).headers ?? {},
      "set-cookie"
    )
  );

  return {
    status: (response as { status?: number }).status ?? 0,
    body: response.data,
    cookieHeader,
  };
}
