import { getBrowserAxios, logBrowserError } from "../../utils/browserRequest.js";
import { mergeCookies, pickHeaderCaseInsensitive, } from "../../utils/merge-response-cookies/mergeResponseCookies.js";
import { parseNumberLike } from "./parse-number-like/parseNumberLike.js";
import { parseCartResponse, parsePackPrice } from "./perfect-cart-response/perfectCartResponse.js";
import { tryPerfectHtmlFallback } from "./perfect-html-fallback/perfectHtmlFallback.js";
import { toStockAndPrice } from "./perfect-per-piece-stock/perfectPerPieceStock.js";
import { extractProductId, extractTitle, extractToken } from "./perfect-product-page-extract/perfectProductPageExtract.js";
const PERFECT_CART_URL = "https://perfectparty.in.ua/cart";
const PERFECT_CART_SHOW_URL = "https://perfectparty.in.ua/cart?action=show";
const NEGATIVE_OUTCOME = { stock: -1, price: -1 };
/**
 * Получает остаток и цену товара с perfectparty.in.ua через запрос add-to-cart в корзину.
 * Фасовка: «N шт» в названии или «Штук в упаковці: N» на странице — тогда остаток в штуках и цена за штуку.
 * Если товар не попадает в ответ корзины (часто «розпродано»), подставляет цену и остаток 0 с HTML карточки.
 */
export async function getPerfectStockData(link) {
    if (!link || typeof link !== "string") {
        throw new Error("Link is required and must be a string");
    }
    const productUrl = link.trim();
    if (!productUrl) {
        throw new Error("Link is required and must be a string");
    }
    try {
        const client = getBrowserAxios();
        const htmlResponse = await client.get(productUrl, {
            responseType: "text",
            transformResponse: [(data) => data],
        });
        const html = String(htmlResponse.data ?? "");
        if (!html.trim())
            return NEGATIVE_OUTCOME;
        const htmlRespHeaders = htmlResponse.headers ?? {};
        let cookieHeader = mergeCookies("", pickHeaderCaseInsensitive(htmlRespHeaders, "set-cookie"));
        let token = extractToken(html);
        const productId = extractProductId(html, productUrl);
        if (!productId)
            return NEGATIVE_OUTCOME;
        // На части страниц token не встроен в HTML карточки, но есть на странице корзины.
        if (!token) {
            const cartShowResp = await client.get(PERFECT_CART_SHOW_URL, {
                headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
                responseType: "text",
                transformResponse: [(data) => data],
            });
            const cartShowHeaders = cartShowResp.headers ?? {};
            cookieHeader = mergeCookies(cookieHeader, pickHeaderCaseInsensitive(cartShowHeaders, "set-cookie"));
            token = extractToken(String(cartShowResp.data ?? ""));
            if (!token)
                return NEGATIVE_OUTCOME;
        }
        const pageTitle = extractTitle(html);
        const formData = new URLSearchParams({
            token,
            id_product: productId,
            id_customization: "0",
            qty: "1",
            first_name: "",
            last_name: "",
            phone: "",
            email: "",
            id_country: "216",
            id_toc_state: "325",
            city: "",
            address: "",
            add: "1",
            action: "update",
        });
        const cartResp = await client.post(PERFECT_CART_URL, formData.toString(), {
            headers: {
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Origin: "https://perfectparty.in.ua",
                Referer: productUrl,
                "X-Requested-With": "XMLHttpRequest",
                ...(cookieHeader && { Cookie: cookieHeader }),
            },
            responseType: "text",
            transformResponse: [(data) => data],
        });
        const cartData = parseCartResponse(String(cartResp.data ?? ""));
        const product = cartData?.cart?.products?.[0];
        if (!product) {
            return tryPerfectHtmlFallback(html, pageTitle) ?? NEGATIVE_OUTCOME;
        }
        const stockPacksRaw = parseNumberLike(product.stock_quantity);
        const packPrice = parsePackPrice(product);
        if (stockPacksRaw === null || packPrice === null) {
            return tryPerfectHtmlFallback(html, pageTitle) ?? NEGATIVE_OUTCOME;
        }
        const stockPacks = Math.floor(stockPacksRaw);
        if (!Number.isFinite(stockPacks) || stockPacks < 0)
            return NEGATIVE_OUTCOME;
        const title = (product.name ??
            product.embedded_attributes?.name ??
            pageTitle).trim();
        return toStockAndPrice(stockPacks, packPrice, title, html);
    }
    catch (error) {
        logBrowserError("Error fetching data from perfectparty product page:", error);
        return NEGATIVE_OUTCOME;
    }
}
