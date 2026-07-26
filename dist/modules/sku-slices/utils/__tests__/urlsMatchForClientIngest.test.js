import { describe, expect, it } from "vitest";
import { normalizeComparableUrl, urlsMatchForClientIngest, } from "../urlsMatchForClientIngest.js";
describe("normalizeComparableUrl", () => {
    it("strips hash and trailing slash", () => {
        expect(normalizeComparableUrl("https://airballoons.com.ua/ua/product/x/?q=1#frag")).toBe("https://airballoons.com.ua/ua/product/x?q=1");
    });
});
describe("urlsMatchForClientIngest", () => {
    it("matches equivalent urls", () => {
        expect(urlsMatchForClientIngest("https://airballoons.com.ua/ua/product/x/", "https://airballoons.com.ua/ua/product/x")).toBe(true);
    });
    it("rejects different paths", () => {
        expect(urlsMatchForClientIngest("https://airballoons.com.ua/ua/product/a", "https://airballoons.com.ua/ua/product/b")).toBe(false);
    });
    it("returns false for invalid url", () => {
        expect(urlsMatchForClientIngest("not-a-url", "https://x.com")).toBe(false);
    });
});
