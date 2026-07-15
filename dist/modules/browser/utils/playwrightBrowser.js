import { createLogger } from "../../../logging/createLogger.js";
import { parseHttpProxyUrl } from "./parse-http-proxy-url/parseHttpProxyUrl.js";
const browserLog = createLogger({ module: "browser" });
const DEFAULT_PLAYWRIGHT_CONCURRENCY = 2;
let browserPromise = null;
let defaultContextPromise = null;
let chromiumLoader = null;
let activeSlots = 0;
const slotWaiters = [];
function getConcurrencyLimit() {
    const raw = process.env.BROWSER_PLAYWRIGHT_CONCURRENCY?.trim();
    if (!raw) {
        return DEFAULT_PLAYWRIGHT_CONCURRENCY;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) {
        return DEFAULT_PLAYWRIGHT_CONCURRENCY;
    }
    return Math.floor(n);
}
async function loadChromium() {
    if (chromiumLoader) {
        return chromiumLoader();
    }
    const { chromium } = await import("playwright");
    return chromium;
}
/**
 * Подмена загрузчика Playwright в тестах (без реального Chromium).
 */
export function setPlaywrightChromiumLoaderForTests(loader) {
    chromiumLoader = loader;
}
async function acquireSlot() {
    const limit = getConcurrencyLimit();
    if (activeSlots < limit) {
        activeSlots += 1;
        return;
    }
    await new Promise((resolve) => {
        slotWaiters.push(() => {
            activeSlots += 1;
            resolve();
        });
    });
}
function releaseSlot() {
    activeSlots = Math.max(0, activeSlots - 1);
    const next = slotWaiters.shift();
    if (next) {
        next();
    }
}
export async function withPlaywrightSlot(fn) {
    await acquireSlot();
    try {
        return await fn();
    }
    finally {
        releaseSlot();
    }
}
async function getBrowser() {
    if (!browserPromise) {
        browserPromise = (async () => {
            const chromium = await loadChromium();
            browserLog.info("launching Playwright Chromium");
            return chromium.launch({ headless: true });
        })().catch((err) => {
            browserPromise = null;
            throw err;
        });
    }
    return browserPromise;
}
async function getDefaultContext() {
    if (!defaultContextPromise) {
        defaultContextPromise = (async () => {
            const browser = await getBrowser();
            return browser.newContext({
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                locale: "uk-UA",
            });
        })().catch((err) => {
            defaultContextPromise = null;
            throw err;
        });
    }
    return defaultContextPromise;
}
/**
 * Контекст для запроса: shared без прокси, либо ephemeral с proxy.
 * Caller обязан закрыть ephemeral context после использования.
 */
export async function acquirePlaywrightContext(options) {
    const proxyUrl = options?.proxyUrl?.trim();
    if (!proxyUrl) {
        return { context: await getDefaultContext(), ephemeral: false };
    }
    const parsed = parseHttpProxyUrl(proxyUrl);
    if (!parsed) {
        throw new Error(`Invalid browser HTTP proxy URL: ${proxyUrl}`);
    }
    const server = `${parsed.protocol}://${parsed.host}:${parsed.port}`;
    const browser = await getBrowser();
    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale: "uk-UA",
        proxy: {
            server,
            ...(parsed.auth && {
                username: parsed.auth.username,
                password: parsed.auth.password,
            }),
        },
    });
    return { context, ephemeral: true };
}
/**
 * Закрывает Playwright browser/context. No-op если не поднимался.
 */
export async function closePlaywrightBrowser() {
    const contextP = defaultContextPromise;
    const browserP = browserPromise;
    defaultContextPromise = null;
    browserPromise = null;
    activeSlots = 0;
    slotWaiters.length = 0;
    if (contextP) {
        try {
            const ctx = await contextP;
            await ctx.close();
        }
        catch (err) {
            browserLog.warn({ err }, "failed to close Playwright default context");
        }
    }
    if (browserP) {
        try {
            const browser = await browserP;
            await browser.close();
            browserLog.info("Playwright Chromium closed");
        }
        catch (err) {
            browserLog.warn({ err }, "failed to close Playwright browser");
        }
    }
}
