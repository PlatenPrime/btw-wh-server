import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mockWarn = vi.hoisted(() => vi.fn());
vi.mock("../../../../logging/createLogger.js", () => ({
    createLogger: () => ({
        warn: mockWarn,
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }),
}));
import { clearImpitClientCacheForTests, formatImpitFetchError, impitGet, setImpitFactoryForTests, summarizeImpitErrorBody, } from "../impitGet.js";
function makeClient(handlers) {
    return { fetch: handlers.fetch };
}
describe("formatImpitFetchError", () => {
    it("пробрасывает Impit GET HTTP message", () => {
        expect(formatImpitFetchError("https://x", new Error("Impit GET HTTP 403: https://x"))).toBe("Impit GET HTTP 403: https://x");
    });
    it("оборачивает прочие ошибки", () => {
        expect(formatImpitFetchError("https://x", new Error("boom"))).toBe("Impit GET https://x failed: boom");
    });
});
describe("summarizeImpitErrorBody", () => {
    it("извлекает title и ужимает snippet", () => {
        const html = `<html><head><title>  429\nBlocked  </title></head><body>${"z".repeat(500)}</body></html>`;
        const out = summarizeImpitErrorBody(html);
        expect(out.title).toBe("429 Blocked");
        expect(out.snippet.length).toBeLessThanOrEqual(300);
        expect(out.htmlLength).toBe(html.length);
    });
});
describe("impitGet", () => {
    beforeEach(() => {
        clearImpitClientCacheForTests();
        setImpitFactoryForTests(null);
        mockWarn.mockClear();
    });
    afterEach(() => {
        setImpitFactoryForTests(null);
        clearImpitClientCacheForTests();
    });
    it("возвращает text при 200", async () => {
        const fetch = vi.fn(async () => ({
            status: 200,
            text: async () => "<html>ok</html>",
        }));
        setImpitFactoryForTests(() => makeClient({ fetch }));
        const html = await impitGet("https://example.com/p");
        expect(html).toBe("<html>ok</html>");
        expect(fetch).toHaveBeenCalledWith("https://example.com/p", {
            timeout: 30_000,
        });
    });
    it("передаёт cookieJar и proxyUrl в фабрику и кэширует клиент", async () => {
        const factory = vi.fn(() => makeClient({
            fetch: vi.fn(async () => ({
                status: 200,
                text: async () => "a",
            })),
        }));
        setImpitFactoryForTests(factory);
        await impitGet("https://a", { proxyUrl: "http://proxy:1" });
        await impitGet("https://b", { proxyUrl: "http://proxy:1" });
        expect(factory).toHaveBeenCalledTimes(1);
        expect(factory).toHaveBeenCalledWith({
            browser: "chrome",
            timeout: 30_000,
            proxyUrl: "http://proxy:1",
            cookieJar: expect.objectContaining({
                setCookie: expect.any(Function),
                getCookieString: expect.any(Function),
            }),
        });
    });
    it("передаёт headers на целевой fetch", async () => {
        const fetch = vi.fn(async () => ({
            status: 200,
            text: async () => "ok",
        }));
        setImpitFactoryForTests(() => makeClient({ fetch }));
        await impitGet("https://example.com/p", {
            headers: {
                Referer: "https://example.com/",
                "Sec-Fetch-Site": "same-origin",
            },
        });
        expect(fetch).toHaveBeenCalledWith("https://example.com/p", {
            timeout: 30_000,
            headers: {
                Referer: "https://example.com/",
                "Sec-Fetch-Site": "same-origin",
            },
        });
    });
    it("warm-up затем product — два fetch на одном клиенте", async () => {
        const fetch = vi.fn(async (url) => {
            if (url.endsWith("/")) {
                return { status: 200, text: async () => "home" };
            }
            return { status: 200, text: async () => "product" };
        });
        setImpitFactoryForTests(() => makeClient({ fetch }));
        const html = await impitGet("https://example.com/product/1", {
            warmUpUrl: "https://example.com/",
            headers: { Referer: "https://example.com/" },
        });
        expect(html).toBe("product");
        expect(fetch).toHaveBeenNthCalledWith(1, "https://example.com/", {
            timeout: 30_000,
        });
        expect(fetch).toHaveBeenNthCalledWith(2, "https://example.com/product/1", {
            timeout: 30_000,
            headers: { Referer: "https://example.com/" },
        });
    });
    it("кидает на HTTP ≥ 400 и логирует snippet + Retry-After", async () => {
        setImpitFactoryForTests(() => makeClient({
            fetch: vi.fn(async () => ({
                status: 429,
                statusText: "Too Many Requests",
                headers: {
                    get: (name) => name.toLowerCase() === "retry-after" ? "5" : null,
                },
                text: async () => "<html><head><title>Too Many Requests</title></head><body>rate limited by stormwall</body></html>",
            })),
        }));
        await expect(impitGet("https://example.com/blocked")).rejects.toThrow(/Impit GET HTTP 429 Too Many Requests: https:\/\/example.com\/blocked.*title="Too Many Requests".*body=.*stormwall.*retryAfter="5"/);
        expect(mockWarn).toHaveBeenCalledWith(expect.objectContaining({
            context: "Impit GET non-2xx",
            url: "https://example.com/blocked",
            httpStatus: 429,
            retryAfter: "5",
            title: "Too Many Requests",
        }), "impit http error body");
    });
    it("кидает на невалидный proxy URL", async () => {
        await expect(impitGet("https://example.com", { proxyUrl: "not-a-url" })).rejects.toThrow(/Invalid browser HTTP proxy URL/);
    });
    it("warm-up fail → warn и продолжает к target", async () => {
        const fetch = vi.fn(async (url) => {
            if (url.includes("warm")) {
                throw new Error("warmup down");
            }
            return { status: 200, text: async () => "ok" };
        });
        setImpitFactoryForTests(() => makeClient({ fetch }));
        const html = await impitGet("https://example.com/p", {
            warmUpUrl: "https://example.com/warm",
        });
        expect(html).toBe("ok");
        expect(mockWarn).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it("adm.tools 429 challenge → POST ___ack → retry GET 200", async () => {
        const challengeHtml = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>form.append('___ack', eval('6-27+26+56'));</script>`;
        let getCount = 0;
        const fetch = vi.fn(async (_url, init) => {
            if (init?.method === "POST") {
                expect(init.body).toBeInstanceOf(FormData);
                expect(init.body.get("___ack")).toBe("61");
                return { status: 200, text: async () => "acked" };
            }
            getCount += 1;
            if (getCount === 1) {
                return {
                    status: 429,
                    statusText: "Too Many Requests",
                    text: async () => challengeHtml,
                };
            }
            return {
                status: 200,
                text: async () => "<html>product ok</html>",
            };
        });
        setImpitFactoryForTests(() => makeClient({ fetch }));
        const html = await impitGet("https://airballoons.com.ua/ua/product/x");
        expect(html).toBe("<html>product ok</html>");
        expect(fetch).toHaveBeenCalledTimes(3);
    });
    it("adm.tools 429 JSON __ack challenge → POST JSON → retry GET 200", async () => {
        const challengeHtml = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>xhr.send(JSON.stringify({__ack: eval('10-93-92+33')}));</script>`;
        let getCount = 0;
        const fetch = vi.fn(async (_url, init) => {
            if (init?.method === "POST") {
                expect(init.body).toBe(JSON.stringify({ __ack: -142 }));
                expect(init.headers?.["Content-Type"]).toBe("application/json; charset=UTF-8");
                return { status: 200, text: async () => "acked" };
            }
            getCount += 1;
            if (getCount === 1) {
                return {
                    status: 429,
                    statusText: "Too Many Requests",
                    text: async () => challengeHtml,
                };
            }
            return {
                status: 200,
                text: async () => "<html>product ok</html>",
            };
        });
        setImpitFactoryForTests(() => makeClient({ fetch }));
        const html = await impitGet("https://airballoons.com.ua/ua/product/x");
        expect(html).toBe("<html>product ok</html>");
        expect(fetch).toHaveBeenCalledTimes(3);
    });
    it("adm.tools 200 challenge HTML → POST ack → retry GET product", async () => {
        const challengeHtml = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>xhr.send(JSON.stringify({__ack: eval('1+2')}));</script>`;
        let getCount = 0;
        const fetch = vi.fn(async (_url, init) => {
            if (init?.method === "POST") {
                expect(init.body).toBe(JSON.stringify({ __ack: 3 }));
                return { status: 200, text: async () => "acked" };
            }
            getCount += 1;
            if (getCount === 1) {
                return {
                    status: 200,
                    text: async () => challengeHtml,
                };
            }
            return {
                status: 200,
                text: async () => "<html>product ok</html>",
            };
        });
        setImpitFactoryForTests(() => makeClient({ fetch }));
        const html = await impitGet("https://airballoons.com.ua/ua/product/x");
        expect(html).toBe("<html>product ok</html>");
        expect(fetch).toHaveBeenCalledTimes(3);
    });
    it("adm.tools challenge POST fail → исходный 429 throw", async () => {
        const challengeHtml = `<!DOCTYPE html>
<title>Захищена сторінка</title>
<a href="https://adm.tools">adm.tools</a>
<script>form.append('___ack', eval('1+1'));</script>`;
        const fetch = vi.fn(async (_url, init) => {
            if (init?.method === "POST") {
                return { status: 500, text: async () => "fail" };
            }
            return {
                status: 429,
                statusText: "Too Many Requests",
                text: async () => challengeHtml,
            };
        });
        setImpitFactoryForTests(() => makeClient({ fetch }));
        await expect(impitGet("https://airballoons.com.ua/ua/product/x")).rejects.toThrow(/Impit GET HTTP 429/);
        expect(mockWarn).toHaveBeenCalledWith(expect.objectContaining({
            context: "adm.tools challenge solve failed",
        }), "adm tools challenge failed");
    });
});
