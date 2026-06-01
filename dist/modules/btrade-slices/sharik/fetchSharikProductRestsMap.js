import { browserGet, logBrowserError, summarizeBrowserError, } from "../../browser/utils/browserRequest.js";
import { buildProductRestsUrl, getProductRestsSeedArtikul } from "./constants.js";
import { parseSharikProductRestsHtml } from "./parseSharikProductRestsHtml.js";
/**
 * Загружает страницу product_rests и возвращает карту артикул → остаток/цена.
 */
export async function fetchSharikProductRestsMap(seedArtikul = getProductRestsSeedArtikul()) {
    if (!seedArtikul || typeof seedArtikul !== "string") {
        throw new Error("Seed artikul is required and must be a string");
    }
    const url = buildProductRestsUrl(seedArtikul);
    try {
        const html = await browserGet(url);
        return parseSharikProductRestsHtml(html);
    }
    catch (error) {
        logBrowserError("Error fetching Sharik product_rests:", error);
        throw new Error(`Failed to fetch Sharik product_rests: ${summarizeBrowserError(error)}`);
    }
}
