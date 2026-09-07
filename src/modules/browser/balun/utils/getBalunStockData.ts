import * as cheerio from "cheerio";
import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import { parseJsonHtmlAttribute } from "../../utils/parse-json-html-attribute/parseJsonHtmlAttribute.js";
import { parseStrippedDecimal } from "../../utils/parse-stripped-decimal/parseStrippedDecimal.js";
import { extractBalunCsrfToken } from "./extract-balun-csrf-token/extractBalunCsrfToken.js";
import { extractBalunProductId } from "./extract-balun-product-id/extractBalunProductId.js";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  BALUN_PROBE_QUANTITY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
} from "./balun-graphql/balunGraphqlQueries.js";
import {
  parseBalunAddProductResponse,
  parseBalunChangeQuantityResponse,
} from "./balun-graphql/parseBalunCartGraphql.js";
import {
  BROWSER_TEXT_CONFIG,
  postBalunGraphql,
} from "./balun-graphql/postBalunGraphql.js";

export interface BalunProductInfo {
  stock: number;
  price: number;
}

interface AnalyticsData {
  clerk?: { price_original?: string };
}

const NEGATIVE_OUTCOME: BalunProductInfo = { stock: -1, price: -1 };

/**
 * Цена со страницы: data-analytics → clerk.price_original.
 */
export function parseBalunHtmlPrice(html: string): number | undefined {
  const $ = cheerio.load(html);
  const analyticsAttr = $("[data-analytics]").first().attr("data-analytics");
  const analyticsData = parseJsonHtmlAttribute(analyticsAttr) as
    | AnalyticsData
    | undefined;
  const priceOriginal = analyticsData?.clerk?.price_original;
  if (priceOriginal === undefined || priceOriginal === "") {
    return undefined;
  }
  const price = parseStrippedDecimal(String(priceOriginal));
  return price === null ? undefined : price;
}

function resolvePrice(
  htmlPrice: number | undefined,
  graphqlPrice: number | null | undefined
): number | undefined {
  if (htmlPrice !== undefined) return htmlPrice;
  if (graphqlPrice != null && Number.isFinite(graphqlPrice) && graphqlPrice >= 0) {
    return graphqlPrice;
  }
  return undefined;
}

function withPrice(stock: number, price: number | undefined): BalunProductInfo {
  if (price === undefined) return NEGATIVE_OUTCOME;
  return { stock, price };
}

/**
 * Остаток и цена карточки Balun.
 * Stock — GraphQL-кламп корзины (`recalculatedQuantity` при qty >> склада).
 * Price — `data-analytics.clerk.price_original`, иначе unit.selling из корзины.
 * Негативный исход — `{ stock: -1, price: -1 }`.
 */
export async function getBalunStockData(
  link: string
): Promise<BalunProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();
  if (!productUrl) {
    throw new Error("Link is required and must be a string");
  }

  try {
    const productId = extractBalunProductId(productUrl);
    if (!productId) {
      return NEGATIVE_OUTCOME;
    }

    const client = getBrowserAxios();
    const htmlResponse = await client.get<string>(productUrl, BROWSER_TEXT_CONFIG);
    const html = String(htmlResponse.data ?? "");
    if (!html.trim()) {
      return NEGATIVE_OUTCOME;
    }

    const htmlHeaders =
      (htmlResponse as { headers?: Record<string, unknown> }).headers ?? {};
    let cookieHeader = mergeCookies(
      "",
      pickHeaderCaseInsensitive(htmlHeaders, "set-cookie")
    );
    const csrfToken = extractBalunCsrfToken(html, cookieHeader);
    const htmlPrice = parseBalunHtmlPrice(html);

    const addResp = await postBalunGraphql(client, {
      operationName: "AddProductToCart",
      query: ADD_PRODUCT_TO_CART_QUERY,
      variables: {
        payload: {
          productId,
          quantity: 1,
          source: "COMPANY_SITE",
        },
        viewerSource: "COMPANY_SITE",
      },
      productUrl,
      cookieHeader,
      csrfToken,
    });
    cookieHeader = addResp.cookieHeader;

    if (addResp.status >= 400) {
      return NEGATIVE_OUTCOME;
    }

    const addResult = parseBalunAddProductResponse(addResp.body, productId);
    if (addResult.kind === "notOrderable") {
      return withPrice(0, htmlPrice);
    }
    if (addResult.kind !== "success") {
      return NEGATIVE_OUTCOME;
    }

    const changeResp = await postBalunGraphql(client, {
      operationName: "CartChangeProductQuantity",
      query: CART_CHANGE_PRODUCT_QUANTITY_QUERY,
      variables: {
        payload: {
          productId,
          quantity: BALUN_PROBE_QUANTITY,
          source: "COMPANY_SITE",
        },
        cartId: addResult.cartId,
        source: "COMPANY_SITE",
      },
      productUrl,
      cookieHeader,
      csrfToken,
    });

    if (changeResp.status >= 400) {
      return NEGATIVE_OUTCOME;
    }

    const changeResult = parseBalunChangeQuantityResponse(
      changeResp.body,
      productId
    );
    if (changeResult.kind !== "recalculated") {
      return NEGATIVE_OUTCOME;
    }

    const price = resolvePrice(
      htmlPrice,
      changeResult.unitSellingPrice ?? addResult.unitSellingPrice
    );
    return withPrice(changeResult.quantity, price);
  } catch (error) {
    logBrowserError("Error fetching data from balun product page:", error);
    return NEGATIVE_OUTCOME;
  }
}
