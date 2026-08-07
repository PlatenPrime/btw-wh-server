import { browserGet, logBrowserError, summarizeBrowserError, } from "../../../utils/browserRequest.js";
import { getSharikHttpProxyUrl } from "../getSharikHttpProxyUrl.js";
import { buildProductRestsUrl, getProductRestsSeedArtikul, } from "./constants.js";
import { parseSharikProductRestsHtml } from "./parseSharikProductRestsHtml.js";
/**
 * Загружает страницу product_rests и возвращает карту артикул → actual/slice/price.
 * HTTP-прокси: `SHARIK_HTTP_PROXY_URL` при `SHARIK_HTTP_PROXY_ENABLED`.
 */
export async function fetchSharikProductRestsMap(seedArtikul = getProductRestsSeedArtikul()) {
    if (!seedArtikul || typeof seedArtikul !== "string") {
        throw new Error("Seed artikul is required and must be a string");
    }
    const url = buildProductRestsUrl(seedArtikul);
    try {
        const html = await browserGet(url, {
            proxyUrl: getSharikHttpProxyUrl(),
        });
        return parseSharikProductRestsHtml(html);
    }
    catch (error) {
        logBrowserError("Error fetching Sharik product_rests:", error);
        throw new Error(`Failed to fetch Sharik product_rests: ${summarizeBrowserError(error)}`);
    }
}
