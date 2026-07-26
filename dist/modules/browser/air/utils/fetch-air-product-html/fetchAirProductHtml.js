import { BROWSER_REQUEST_TIMEOUT_MS, getBrowserAxios, resolveBrowserProxyAgents, } from "../../../utils/browserRequest.js";
import { mergeCookies, pickHeaderCaseInsensitive, } from "../../../utils/merge-response-cookies/mergeResponseCookies.js";
import { sleep } from "../../../utils/sleep.js";
import { AIR_BROWSER_HEADERS } from "../air-browser-headers/airBrowserHeaders.js";
import { getAirHttpProxyUrl } from "../getAirHttpProxyUrl.js";
/** Итого попыток product GET (1 + 2 retry). */
export const AIR_PRODUCT_FETCH_MAX_ATTEMPTS = 3;
/** Fallback delays перед 2-й и 3-й попыткой, если нет Retry-After. */
export const AIR_PRODUCT_FETCH_RETRY_DELAYS_MS = [2000, 5000];
const MAX_RETRY_AFTER_MS = 60_000;
const AIR_TEXT_CONFIG = {
    responseType: "text",
    transformResponse: [(data) => data],
    validateStatus: () => true,
    timeout: BROWSER_REQUEST_TIMEOUT_MS,
    proxy: false,
};
/**
 * Парсит Retry-After (секунды). HTTP-date игнорируется → undefined.
 * Кап 60s.
 */
export function resolveRetryAfterMs(retryAfter) {
    if (retryAfter === undefined || retryAfter === null)
        return undefined;
    const raw = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter;
    if (typeof raw !== "string" && typeof raw !== "number")
        return undefined;
    const seconds = Number(String(raw).trim());
    if (!Number.isFinite(seconds) || seconds < 0)
        return undefined;
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}
export function resolveAirProductOrigin(productUrl) {
    const parsed = new URL(productUrl);
    return parsed.origin;
}
/**
 * Agents из `getAirHttpProxyUrl()`; без env — undefined (прямой egress).
 * @throws Error при невалидном proxy URL
 */
export function resolveAirProxyAgents() {
    return resolveBrowserProxyAgents(getAirHttpProxyUrl());
}
function buildProductHeaders(origin, cookieHeader) {
    return {
        ...AIR_BROWSER_HEADERS,
        Referer: `${origin}/`,
        "Sec-Fetch-Site": "same-origin",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };
}
function formatAirFetchHttpError(url, status) {
    return `Browser GET HTTP ${status}: ${url}`;
}
async function warmUpAirOrigin(origin, agents) {
    const client = getBrowserAxios();
    const warmUrl = `${origin}/`;
    const response = await client.get(warmUrl, {
        ...AIR_TEXT_CONFIG,
        headers: { ...AIR_BROWSER_HEADERS },
        ...(agents && {
            httpAgent: agents.httpAgent,
            httpsAgent: agents.httpsAgent,
        }),
    });
    const headers = (response.headers ?? {});
    const cookieHeader = mergeCookies("", pickHeaderCaseInsensitive(headers, "set-cookie"));
    return { cookieHeader };
}
/**
 * Получает HTML страницы товара air: warm-up origin → cookies → product GET.
 * HTTP-прокси: HttpsProxyAgent из `getAirHttpProxyUrl()`.
 * На 429 — до 2 retry с Retry-After или 2s/5s.
 */
export async function fetchAirProductHtml(productUrl) {
    if (!productUrl || typeof productUrl !== "string") {
        throw new Error("Product URL is required and must be a string");
    }
    const trimmed = productUrl.trim();
    if (!trimmed) {
        throw new Error("Product URL is required and must be a string");
    }
    let origin;
    try {
        origin = resolveAirProductOrigin(trimmed);
    }
    catch {
        throw new Error(`Invalid air product URL: ${trimmed}`);
    }
    const agents = resolveAirProxyAgents();
    const client = getBrowserAxios();
    let cookieHeader = "";
    let lastStatus = 0;
    for (let attempt = 0; attempt < AIR_PRODUCT_FETCH_MAX_ATTEMPTS; attempt++) {
        if (attempt === 0 || !cookieHeader) {
            const warm = await warmUpAirOrigin(origin, agents);
            cookieHeader = warm.cookieHeader || cookieHeader;
        }
        const response = await client.get(trimmed, {
            ...AIR_TEXT_CONFIG,
            headers: buildProductHeaders(origin, cookieHeader),
            ...(agents && {
                httpAgent: agents.httpAgent,
                httpsAgent: agents.httpsAgent,
            }),
        });
        const status = response.status ?? 0;
        lastStatus = status;
        const html = String(response.data ?? "");
        const respHeaders = (response.headers ?? {});
        cookieHeader = mergeCookies(cookieHeader, pickHeaderCaseInsensitive(respHeaders, "set-cookie"));
        if (status >= 200 && status < 300) {
            if (!html.trim()) {
                throw new Error(`Browser GET empty body: ${trimmed}`);
            }
            return html;
        }
        if (status === 429 && attempt < AIR_PRODUCT_FETCH_MAX_ATTEMPTS - 1) {
            const retryAfterMs = resolveRetryAfterMs(pickHeaderCaseInsensitive(respHeaders, "retry-after"));
            const fallbackMs = AIR_PRODUCT_FETCH_RETRY_DELAYS_MS[attempt] ??
                AIR_PRODUCT_FETCH_RETRY_DELAYS_MS[AIR_PRODUCT_FETCH_RETRY_DELAYS_MS.length - 1];
            await sleep(retryAfterMs ?? fallbackMs);
            continue;
        }
        throw new Error(formatAirFetchHttpError(trimmed, status || lastStatus));
    }
    throw new Error(formatAirFetchHttpError(trimmed, lastStatus || 429));
}
