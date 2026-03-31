import * as cheerio from "cheerio";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crawlHtmlGroupListingPages, getNextPageUrlFromLinkRelNext, mergeSearchParamsFromSource, } from "../crawlHtmlGroupListingPages.js";
import { browserGet } from "../../../utils/browserRequest.js";
import { sleep } from "../../../utils/sleep.js";
vi.mock("../../../utils/browserRequest.js");
vi.mock("../../../utils/sleep.js", () => ({
    sleep: vi.fn(() => Promise.resolve()),
}));
const START = "https://example.test/list";
const PAGE2 = "https://example.test/list/page2";
function htmlWithNext(body, nextHref) {
    const next = nextHref != null
        ? `<link rel="next" href="${nextHref}" />`
        : "";
    return `<!DOCTYPE html><html><head>${next}</head><body>${body}</body></html>`;
}
describe("getNextPageUrlFromLinkRelNext", () => {
    it("returns null when rel=next is absent", () => {
        const $ = cheerio.load("<html><head></head></html>");
        expect(getNextPageUrlFromLinkRelNext($, START, () => null)).toBeNull();
    });
    it("returns null when resolveUrl rejects the href", () => {
        const $ = cheerio.load('<html><head><link rel="next" href="/p2" /></head></html>');
        expect(getNextPageUrlFromLinkRelNext($, START, () => null)).toBeNull();
    });
    it("resolves next href via resolveUrl", () => {
        const $ = cheerio.load('<html><head><link rel="next" href="page2" /></head></html>');
        const base = "https://example.test/list/";
        const resolved = getNextPageUrlFromLinkRelNext($, base, (href, b) => new URL(href, b).toString());
        expect(resolved).toBe("https://example.test/list/page2");
    });
});
describe("mergeSearchParamsFromSource", () => {
    it("appends all search params from source onto target", () => {
        const merged = mergeSearchParamsFromSource("https://balun.example.test/ua/g1/page_2", "https://balun.example.test/ua/g1?product_items_per_page=48&csbss47=793");
        expect(merged).toBe("https://balun.example.test/ua/g1/page_2?product_items_per_page=48&csbss47=793");
    });
    it("overwrites keys on target with values from source", () => {
        const merged = mergeSearchParamsFromSource("https://example.test/list/page_2?foo=old&keep=1", "https://example.test/list?foo=new");
        expect(merged).toBe("https://example.test/list/page_2?foo=new&keep=1");
    });
});
describe("crawlHtmlGroupListingPages", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
        vi.mocked(sleep).mockClear();
    });
    it("fetches one page and returns parsed products", async () => {
        const html = htmlWithNext('<div id="p1">a</div>');
        vi.mocked(browserGet).mockResolvedValue(html);
        const result = await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 10,
            parseProductsFromPage: ($) => {
                const m = new Map();
                if ($("#p1").length)
                    m.set("1", { id: "1" });
                return m;
            },
            getNextPageUrl: () => null,
        });
        expect(result).toEqual([{ id: "1" }]);
        expect(browserGet).toHaveBeenCalledTimes(1);
        expect(browserGet).toHaveBeenCalledWith(START);
        expect(sleep).not.toHaveBeenCalled();
    });
    it("merges products across two pages", async () => {
        const h1 = htmlWithNext('<span data-id="a"></span>', PAGE2);
        const h2 = htmlWithNext('<span data-id="b"></span>');
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === START)
                return h1;
            if (url === PAGE2)
                return h2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const resolve = (href, base) => new URL(href, base).toString();
        const result = await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 5,
            parseProductsFromPage: ($, pageUrl) => {
                const m = new Map();
                $("span[data-id]").each((_, el) => {
                    const id = $(el).attr("data-id");
                    if (id)
                        m.set(id, { id, from: pageUrl });
                });
                return m;
            },
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
        });
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.id).sort()).toEqual(["a", "b"]);
        expect(browserGet).toHaveBeenCalledTimes(2);
        expect(sleep).not.toHaveBeenCalled();
    });
    it("respects maxPages and does not fetch beyond the limit", async () => {
        const h1 = htmlWithNext('<i data-x="1"></i>', PAGE2);
        const h2 = htmlWithNext('<i data-x="2"></i>', PAGE2);
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === START)
                return h1;
            if (url === PAGE2)
                return h2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const resolve = (href, base) => new URL(href, base).toString();
        const result = await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 1,
            parseProductsFromPage: ($) => {
                const m = new Map();
                $("i[data-x]").each((_, el) => {
                    const id = $(el).attr("data-x");
                    if (id)
                        m.set(id, { id });
                });
                return m;
            },
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
        });
        expect(result).toEqual([{ id: "1" }]);
        expect(browserGet).toHaveBeenCalledTimes(1);
    });
    it("stops when stopOnEmptyPage and parser returns empty map", async () => {
        const h1 = htmlWithNext('<b data-k="1"></b>', PAGE2);
        const h2 = htmlWithNext("");
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === START)
                return h1;
            if (url === PAGE2)
                return h2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const resolve = (href, base) => new URL(href, base).toString();
        const result = await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 10,
            parseProductsFromPage: ($) => {
                const m = new Map();
                $("b[data-k]").each((_, el) => {
                    const k = $(el).attr("data-k");
                    if (k)
                        m.set(k, { k });
                });
                return m;
            },
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
            stopOnEmptyPage: true,
        });
        expect(result).toEqual([{ k: "1" }]);
        expect(browserGet).toHaveBeenCalledTimes(2);
    });
    it("continues after empty page when stopOnEmptyPage is false", async () => {
        const h1 = htmlWithNext("", PAGE2);
        const h2 = htmlWithNext('<b data-k="2"></b>');
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === START)
                return h1;
            if (url === PAGE2)
                return h2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const resolve = (href, base) => new URL(href, base).toString();
        const result = await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 10,
            parseProductsFromPage: ($) => {
                const m = new Map();
                $("b[data-k]").each((_, el) => {
                    const k = $(el).attr("data-k");
                    if (k)
                        m.set(k, { k });
                });
                return m;
            },
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
        });
        expect(result).toEqual([{ k: "2" }]);
        expect(browserGet).toHaveBeenCalledTimes(2);
    });
    it("stops when next URL was already visited", async () => {
        const html = htmlWithNext('<b data-k="x"></b>', START);
        vi.mocked(browserGet).mockResolvedValue(html);
        const resolve = (href, base) => new URL(href, base).toString();
        const result = await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 10,
            parseProductsFromPage: ($) => {
                const m = new Map();
                if ($("b[data-k]").length)
                    m.set("x", { k: "x" });
                return m;
            },
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
        });
        expect(result).toEqual([{ k: "x" }]);
        expect(browserGet).toHaveBeenCalledTimes(1);
    });
    it("calls sleep between pages when delayBeforeNextMs is set", async () => {
        const h1 = htmlWithNext('<i></i>', PAGE2);
        const h2 = htmlWithNext("<i></i>");
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === START)
                return h1;
            if (url === PAGE2)
                return h2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const resolve = (href, base) => new URL(href, base).toString();
        await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 5,
            parseProductsFromPage: () => new Map([["1", { ok: true }]]),
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
            delayBeforeNextMs: 42,
        });
        expect(sleep).toHaveBeenCalledTimes(1);
        expect(sleep).toHaveBeenCalledWith(42);
    });
    it("calls sleep with value from delay provider", async () => {
        const h1 = htmlWithNext("<i></i>", PAGE2);
        const h2 = htmlWithNext("<i></i>");
        vi.mocked(browserGet).mockImplementation(async (url) => {
            if (url === START)
                return h1;
            if (url === PAGE2)
                return h2;
            throw new Error(`Unexpected url: ${url}`);
        });
        const resolve = (href, base) => new URL(href, base).toString();
        const delayProvider = vi.fn(() => 123);
        await crawlHtmlGroupListingPages({
            startUrl: START,
            maxPages: 5,
            parseProductsFromPage: () => new Map([["1", { ok: true }]]),
            getNextPageUrl: ($, url) => getNextPageUrlFromLinkRelNext($, url, resolve),
            delayBeforeNextMs: delayProvider,
        });
        expect(delayProvider).toHaveBeenCalledTimes(1);
        expect(sleep).toHaveBeenCalledTimes(1);
        expect(sleep).toHaveBeenCalledWith(123);
    });
});
