import { browserGet } from "./browserRequest.js";
import { impitGet } from "./impitGet.js";
import { playwrightGet } from "./playwrightGet.js";
import { resolveBrowserTransport, } from "./resolveBrowserTransport.js";
/**
 * Единая точка получения HTML: http (axios), impit (browser TLS) или playwright.
 * Приоритет: options.transport → env по konkName → http.
 */
export async function fetchPageHtml(url, options) {
    const transport = options?.transport ?? resolveBrowserTransport(options?.konkName);
    if (transport === "playwright") {
        return playwrightGet(url, {
            proxyUrl: options?.proxyUrl,
            waitUntil: options?.waitUntil,
            warmUpUrl: options?.warmUpUrl,
        });
    }
    if (transport === "impit") {
        return impitGet(url, {
            proxyUrl: options?.proxyUrl,
            warmUpUrl: options?.warmUpUrl,
        });
    }
    return browserGet(url, { proxyUrl: options?.proxyUrl });
}
