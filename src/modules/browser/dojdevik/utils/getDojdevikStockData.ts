import * as cheerio from "cheerio";
import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
  PROMUA_CART_PROBE_QUANTITY,
} from "../../promua/cart/promUaCartGraphqlQueries.js";
import {
  parsePromUaAddProductResponse,
  parsePromUaChangeQuantityResponse,
} from "../../promua/cart/parsePromUaCartGraphql.js";
import {
  BROWSER_TEXT_CONFIG,
  postPromUaGraphql,
} from "../../promua/cart/postPromUaGraphql.js";
import { extractPromUaCsrfToken } from "../../promua/extract-promua-csrf-token/extractPromUaCsrfToken.js";
import { extractPromUaProductId } from "../../promua/extract-promua-product-id/extractPromUaProductId.js";
import {
  parseDojdevikPackagePriceFromDom,
  parseDojdevikTitleFromDom,
} from "./dojdevik-product-price-from-dom/parseDojdevikPackagePriceFromDom.js";
import type { DojdevikProductInfo } from "./dojdevik-product-types/dojdevikProductInfo.js";
import { DOJDEVIK_NEGATIVE_OUTCOME } from "./dojdevik-product-types/dojdevikProductInfo.js";
import { extractDojdevikPackCount } from "./extract-dojdevik-pack-count/extractDojdevikPackCount.js";

export type { DojdevikProductInfo } from "./dojdevik-product-types/dojdevikProductInfo.js";

export const DOJDEVIK_ORIGIN = "https://dojdevik.com.ua";

function toMoney(value: number): number {
  return Number(value.toFixed(2));
}

function resolvePackagePrice(
  htmlPrice: number | null,
  graphqlPrice: number | null | undefined
): number | undefined {
  if (htmlPrice !== null) return htmlPrice;
  if (graphqlPrice != null && Number.isFinite(graphqlPrice) && graphqlPrice >= 0) {
    return graphqlPrice;
  }
  return undefined;
}

function withNormalizedOutcome(
  packs: number,
  packagePrice: number | undefined,
  packSize: number,
  title: string
): DojdevikProductInfo {
  if (packagePrice === undefined) {
    return DOJDEVIK_NEGATIVE_OUTCOME;
  }

  const price = toMoney(packagePrice / packSize);
  const stock = packs * packSize;
  return title.length > 0 ? { stock, price, title } : { stock, price };
}

/**
 * Остаток и цена карточки dojdevik (Prom company site).
 * Stock — GraphQL clamp упаковок × packSize (штуки).
 * Price — цена упаковки / packSize (2 знака).
 * Негативный исход — `{ stock: -1, price: -1 }`.
 */
export async function getDojdevikStockData(
  link: string
): Promise<DojdevikProductInfo> {
  if (!link || typeof link !== "string") {
    throw new Error("Link is required and must be a string");
  }

  const productUrl = link.trim();
  if (!productUrl) {
    throw new Error("Link is required and must be a string");
  }

  try {
    const productId = extractPromUaProductId(productUrl);
    if (!productId) {
      return DOJDEVIK_NEGATIVE_OUTCOME;
    }

    const client = getBrowserAxios();
    const htmlResponse = await client.get<string>(
      productUrl,
      BROWSER_TEXT_CONFIG
    );
    const html = String(htmlResponse.data ?? "");
    if (!html.trim()) {
      return DOJDEVIK_NEGATIVE_OUTCOME;
    }

    const $ = cheerio.load(html);
    const title = parseDojdevikTitleFromDom($);
    const packSize = extractDojdevikPackCount(html);
    const htmlPackagePrice = parseDojdevikPackagePriceFromDom($);

    const htmlHeaders =
      (htmlResponse as { headers?: Record<string, unknown> }).headers ?? {};
    let cookieHeader = mergeCookies(
      "",
      pickHeaderCaseInsensitive(htmlHeaders, "set-cookie")
    );
    const csrfToken = extractPromUaCsrfToken(html, cookieHeader);

    const addResp = await postPromUaGraphql(client, {
      origin: DOJDEVIK_ORIGIN,
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
      return DOJDEVIK_NEGATIVE_OUTCOME;
    }

    const addResult = parsePromUaAddProductResponse(addResp.body, productId);
    if (addResult.kind === "notOrderable") {
      return withNormalizedOutcome(0, resolvePackagePrice(htmlPackagePrice, null), packSize, title);
    }
    if (addResult.kind !== "success") {
      return DOJDEVIK_NEGATIVE_OUTCOME;
    }

    const changeResp = await postPromUaGraphql(client, {
      origin: DOJDEVIK_ORIGIN,
      operationName: "CartChangeProductQuantity",
      query: CART_CHANGE_PRODUCT_QUANTITY_QUERY,
      variables: {
        payload: {
          productId,
          quantity: PROMUA_CART_PROBE_QUANTITY,
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
      return DOJDEVIK_NEGATIVE_OUTCOME;
    }

    const changeResult = parsePromUaChangeQuantityResponse(
      changeResp.body,
      productId
    );
    if (changeResult.kind !== "recalculated") {
      return DOJDEVIK_NEGATIVE_OUTCOME;
    }

    const packagePrice = resolvePackagePrice(
      htmlPackagePrice,
      changeResult.unitSellingPrice ?? addResult.unitSellingPrice
    );
    return withNormalizedOutcome(
      changeResult.quantity,
      packagePrice,
      packSize,
      title
    );
  } catch (error) {
    logBrowserError("Error fetching data from dojdevik product page:", error);
    return DOJDEVIK_NEGATIVE_OUTCOME;
  }
}
