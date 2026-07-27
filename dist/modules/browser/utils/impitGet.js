import { Impit } from "impit";
import { createLogger } from "../../../logging/createLogger.js";
import { BROWSER_REQUEST_TIMEOUT_MS } from "./browserRequest.js";
const browserLog = createLogger({ module: "browser" });
const defaultImpitFactory = (options) => new Impit({
    browser: options.browser,
    timeout: options.timeout,
    ...(options.proxyUrl ? { proxyUrl: options.proxyUrl } : {}),
});
let impitFactory = defaultImpitFactory;
/** Кэш клиентов по ключу proxy (пустая строка = без proxy). */
const clientByProxyKey = new Map();
/**
 * Подмена фабрики Impit в тестах. `null` — вернуть default и сбросить кэш.
 */
export function setImpitFactoryForTests(factory) {
    impitFactory = factory ?? defaultImpitFactory;
    clientByProxyKey.clear();
}
export function clearImpitClientCacheForTests() {
    clientByProxyKey.clear();
}
function resolveProxyUrl(proxyUrl) {
    const trimmed = proxyUrl?.trim();
    if (!trimmed) {
        return undefined;
    }
    if (!URL.canParse(trimmed)) {
        throw new Error(`Invalid browser HTTP proxy URL: ${trimmed}`);
    }
    return trimmed;
}
function getOrCreateClient(proxyUrl) {
    const key = proxyUrl ?? "";
    const cached = clientByProxyKey.get(key);
    if (cached) {
        return cached;
    }
    const client = impitFactory({
        browser: "chrome",
        timeout: BROWSER_REQUEST_TIMEOUT_MS,
        ...(proxyUrl ? { proxyUrl } : {}),
    });
    clientByProxyKey.set(key, client);
    return client;
}
function truncateMessage(message) {
    const trimmed = message.trim();
    if (trimmed.length <= 200) {
        return trimmed || "unknown";
    }
    return `${trimmed.slice(0, 200)}... [truncated]`;
}
export function formatImpitFetchError(url, err) {
    if (err instanceof Error && err.message.startsWith("Impit GET HTTP ")) {
        return err.message;
    }
    const msg = err instanceof Error ? err.message : String(err);
    return `Impit GET ${url} failed: ${truncateMessage(msg)}`;
}
/**
 * GET HTML через Impit (Chrome TLS/HTTP fingerprint).
 * HTTP status ≥ 400 → throw.
 */
export async function impitGet(url, options) {
    const proxyUrl = resolveProxyUrl(options?.proxyUrl);
    const client = getOrCreateClient(proxyUrl);
    try {
        const warmUpUrl = options?.warmUpUrl?.trim();
        if (warmUpUrl) {
            try {
                await client.fetch(warmUpUrl, {
                    timeout: BROWSER_REQUEST_TIMEOUT_MS,
                });
            }
            catch (warmErr) {
                browserLog.warn({
                    context: "Impit warm-up failed, continue to target",
                    url: warmUpUrl,
                    targetUrl: url,
                    details: warmErr instanceof Error
                        ? warmErr.message
                        : String(warmErr),
                }, "impit warmup failed");
            }
        }
        const response = await client.fetch(url, {
            timeout: BROWSER_REQUEST_TIMEOUT_MS,
        });
        if (response.status >= 400) {
            const statusText = response.statusText?.trim();
            const tail = statusText ? ` ${statusText}` : "";
            throw new Error(`Impit GET HTTP ${response.status}${tail}: ${url}`);
        }
        return await response.text();
    }
    catch (err) {
        throw new Error(formatImpitFetchError(url, err), { cause: err });
    }
}
