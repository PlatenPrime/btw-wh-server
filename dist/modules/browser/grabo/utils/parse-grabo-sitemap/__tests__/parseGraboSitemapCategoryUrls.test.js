import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GRABO_BASE_URL, GRABO_SITEMAP_URL } from "../../types/graboSkuData.js";
import { parseGraboSitemapCategoryUrls } from "../parseGraboSitemapCategoryUrls.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const sitemapHtml = readFileSync(join(__dirname, "../../get-grabo-sku-data/__tests__/fixtures/sitemap.txt"), "utf-8");
describe("GRABO_SITEMAP_URL", () => {
    it("points to english sitemap on grabo origin", () => {
        expect(GRABO_SITEMAP_URL).toBe(`${GRABO_BASE_URL}/en/sitemap`);
    });
});
describe("parseGraboSitemapCategoryUrls", () => {
    it("keeps Products tree including non-message and nested leaves", () => {
        const urls = parseGraboSitemapCategoryUrls(sitemapHtml);
        expect(urls).toContain(`${GRABO_BASE_URL}/en/products`);
        expect(urls).toContain(`${GRABO_BASE_URL}/en/non-message`);
        expect(urls).toContain(`${GRABO_BASE_URL}/en/birthday`);
        expect(urls).toContain(`${GRABO_BASE_URL}/en/shape-14-mini-ds-xl`);
        expect(urls).toContain(`${GRABO_BASE_URL}/en/maverick`);
        expect(urls.length).toBeGreaterThan(10);
    });
    it("skips About Us, catalogues, premioloon and corporate news", () => {
        const urls = parseGraboSitemapCategoryUrls(sitemapHtml);
        expect(urls).not.toContain(`${GRABO_BASE_URL}/en/the-story-the-people`);
        expect(urls).not.toContain(`${GRABO_BASE_URL}/en/catalogues`);
        expect(urls).not.toContain(`${GRABO_BASE_URL}/en/news-grabo`);
        expect(urls.some((url) => url.includes("premioloon"))).toBe(false);
    });
    it("deduplicates identical hrefs", () => {
        const html = `
      <div class="site-map">
        <ul class="level-0">
          <li class="nav900">
            <a href="/en/products">Products</a>
            <ul class="level-1">
              <li><a href="/en/party">Party</a></li>
              <li><a href="/en/party">Party dup</a></li>
            </ul>
          </li>
        </ul>
      </div>
    `;
        expect(parseGraboSitemapCategoryUrls(html)).toEqual([
            `${GRABO_BASE_URL}/en/products`,
            `${GRABO_BASE_URL}/en/party`,
        ]);
    });
    it("returns empty array when sitemap tree is missing", () => {
        expect(parseGraboSitemapCategoryUrls("<html><body></body></html>")).toEqual([]);
    });
});
