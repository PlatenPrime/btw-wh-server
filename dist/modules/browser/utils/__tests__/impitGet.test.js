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
import { clearImpitClientCacheForTests, formatImpitFetchError, impitGet, setImpitFactoryForTests, } from "../impitGet.js";
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
    it("передаёт proxyUrl в фабрику и кэширует клиент", async () => {
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
        });
    });
    it("кидает на HTTP ≥ 400", async () => {
        setImpitFactoryForTests(() => makeClient({
            fetch: vi.fn(async () => ({
                status: 403,
                statusText: "Forbidden",
                text: async () => "nope",
            })),
        }));
        await expect(impitGet("https://example.com/blocked")).rejects.toThrow(/Impit GET HTTP 403 Forbidden: https:\/\/example.com\/blocked/);
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
});
