import { browserGet } from "./browserRequest.js";
import { playwrightGet } from "./playwrightGet.js";
import { resolveBrowserTransport, } from "./resolveBrowserTransport.js";
/**
 * Единая точка получения HTML страницы: http (axios) или playwright.
 * Приоритет: options.transport → env по konkName → http.
 */
export async function fetchPageHtml(url, options) {
    const transport = options?.transport ?? resolveBrowserTransport(options?.konkName);
    if (transport === "playwright") {
        return playwrightGet(url, {
            proxyUrl: options?.proxyUrl,
            waitUntil: options?.waitUntil,
        });
    }
    return browserGet(url, { proxyUrl: options?.proxyUrl });
}
