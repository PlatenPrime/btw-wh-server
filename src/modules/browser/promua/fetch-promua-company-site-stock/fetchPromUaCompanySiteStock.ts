import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import {
  mergeCookies,
  pickHeaderCaseInsensitive,
} from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
  PROMUA_CART_PROBE_QUANTITY,
} from "../cart/promUaCartGraphqlQueries.js";
import {
  parsePromUaAddProductResponse,
  parsePromUaChangeQuantityResponse,
} from "../cart/parsePromUaCartGraphql.js";
import {
  BROWSER_TEXT_CONFIG,
  postPromUaGraphql,
} from "../cart/postPromUaGraphql.js";
import { extractPromUaCsrfToken } from "../extract-promua-csrf-token/extractPromUaCsrfToken.js";
import { extractPromUaProductId } from "../extract-promua-product-id/extractPromUaProductId.js";
import { resolvePromUaUnitPrice } from "../resolve-promua-unit-price/resolvePromUaUnitPrice.js";

export type FetchPromUaCompanySiteStockParams<TContext, TOutcome> = {
  origin: string;
  productUrl: string;
  negativeOutcome: TOutcome;
  /** Контекст со страницы (цена HTML, packSize, title и т.п.). */
  parseHtmlContext: (html: string) => TContext;
  resolveHtmlPrice: (ctx: TContext) => number | null | undefined;
  /**
   * `quantity` — packs/units из GraphQL (0 при notOrderable).
   * `unitPrice` — уже через resolvePromUaUnitPrice (HTML vs GraphQL).
   */
  normalizeOutcome: (params: {
    quantity: number;
    unitPrice: number | undefined;
    ctx: TContext;
  }) => TOutcome;
  logLabel: string;
};

/**
 * Общий stock/price pipeline для Prom.ua company site:
 * GET HTML → CSRF → AddProductToCart → CartChangeProductQuantity probe → normalize.
 */
export async function fetchPromUaCompanySiteStock<TContext, TOutcome>(
  params: FetchPromUaCompanySiteStockParams<TContext, TOutcome>
): Promise<TOutcome> {
  const {
    origin,
    productUrl,
    negativeOutcome,
    parseHtmlContext,
    resolveHtmlPrice,
    normalizeOutcome,
    logLabel,
  } = params;

  try {
    const productId = extractPromUaProductId(productUrl);
    if (!productId) {
      return negativeOutcome;
    }

    const client = getBrowserAxios();
    const htmlResponse = await client.get<string>(
      productUrl,
      BROWSER_TEXT_CONFIG
    );
    const html = String(htmlResponse.data ?? "");
    if (!html.trim()) {
      return negativeOutcome;
    }

    const ctx = parseHtmlContext(html);
    const htmlPrice = resolveHtmlPrice(ctx);

    const htmlHeaders =
      (htmlResponse as { headers?: Record<string, unknown> }).headers ?? {};
    let cookieHeader = mergeCookies(
      "",
      pickHeaderCaseInsensitive(htmlHeaders, "set-cookie")
    );
    const csrfToken = extractPromUaCsrfToken(html, cookieHeader);

    const addResp = await postPromUaGraphql(client, {
      origin,
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
      return negativeOutcome;
    }

    const addResult = parsePromUaAddProductResponse(addResp.body, productId);
    if (addResult.kind === "notOrderable") {
      return normalizeOutcome({
        quantity: 0,
        unitPrice: resolvePromUaUnitPrice(htmlPrice, null),
        ctx,
      });
    }
    if (addResult.kind !== "success") {
      return negativeOutcome;
    }

    const changeResp = await postPromUaGraphql(client, {
      origin,
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
      return negativeOutcome;
    }

    const changeResult = parsePromUaChangeQuantityResponse(
      changeResp.body,
      productId
    );
    if (changeResult.kind !== "recalculated") {
      return negativeOutcome;
    }

    const unitPrice = resolvePromUaUnitPrice(
      htmlPrice,
      changeResult.unitSellingPrice ?? addResult.unitSellingPrice
    );
    return normalizeOutcome({
      quantity: changeResult.quantity,
      unitPrice,
      ctx,
    });
  } catch (error) {
    logBrowserError(`Error fetching data from ${logLabel} product page:`, error);
    return negativeOutcome;
  }
}
