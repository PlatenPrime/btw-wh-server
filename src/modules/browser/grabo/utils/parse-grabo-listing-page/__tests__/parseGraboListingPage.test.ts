import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { GRABO_BASE_URL } from "../../types/graboSkuData.js";
import {
  getGraboListingNextPageUrl,
  isGraboProductPageUrl,
  parseGraboListingPage,
} from "../parseGraboListingPage.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(
  __dirname,
  "../../get-grabo-sku-data/__tests__/fixtures"
);

const page1Html = readFileSync(join(fixturesDir, "products-page-1.txt"), "utf-8");
const page2Html = readFileSync(join(fixturesDir, "product-page-2.txt"), "utf-8");
const page17Html = readFileSync(
  join(fixturesDir, "product-page-17-last.txt"),
  "utf-8"
);

const PAGE1_URL = `${GRABO_BASE_URL}/en/non-message`;
const PAGE2_URL = `${GRABO_BASE_URL}/en/non-message/page-2`;
const PAGE17_URL = `${GRABO_BASE_URL}/en/non-message/page-17`;

describe("isGraboProductPageUrl", () => {
  it("accepts /en/{code}-balloon- product paths", () => {
    expect(
      isGraboProductPageUrl(
        `${GRABO_BASE_URL}/en/g72276-balloon-white-gold-bow-gold`
      )
    ).toBe(true);
    expect(
      isGraboProductPageUrl(
        `${GRABO_BASE_URL}/en/gpw09-p-balloon-pet-walker-dachshund-brown`
      )
    ).toBe(true);
  });

  it("rejects category and filter urls", () => {
    expect(isGraboProductPageUrl(PAGE1_URL)).toBe(false);
    expect(
      isGraboProductPageUrl(`${PAGE1_URL}?tag1=20568`)
    ).toBe(false);
    expect(isGraboProductPageUrl("not-a-url")).toBe(false);
  });
});

describe("parseGraboListingPage", () => {
  it("extracts 24 product urls and next=page-2 from first listing page", () => {
    const parsed = parseGraboListingPage(page1Html, PAGE1_URL);

    expect(parsed.productUrls).toHaveLength(24);
    expect(parsed.productUrls[0]).toBe(
      `${GRABO_BASE_URL}/en/19514-balloon-multicolor-bow-mini-multicolor`
    );
    expect(parsed.productUrls.at(-1)).toBe(
      `${GRABO_BASE_URL}/en/261k-balloon-black-cat-black`
    );
    expect(parsed.nextPageUrl).toBe(PAGE2_URL);
    expect(parsed.productUrls.some((url) => url.includes("page-16"))).toBe(
      false
    );
  });

  it("reads next page from mid listing and ignores rel=last as crawl end", () => {
    const parsed = parseGraboListingPage(page2Html, PAGE2_URL);

    expect(parsed.productUrls).toHaveLength(24);
    expect(parsed.nextPageUrl).toBe(
      `${GRABO_BASE_URL}/en/non-message/page-3`
    );
    expect(parsed.nextPageUrl).not.toContain("page-17");
  });

  it("returns Pink Ribbon and null next on last page", () => {
    const parsed = parseGraboListingPage(page17Html, PAGE17_URL);

    expect(parsed.productUrls).toEqual([
      `${GRABO_BASE_URL}/en/g72272-balloon-pink-ribbon-pink`,
    ]);
    expect(parsed.nextPageUrl).toBeNull();
  });

  it("returns empty products and null next for blank html", () => {
    expect(parseGraboListingPage("<html></html>", PAGE1_URL)).toEqual({
      productUrls: [],
      nextPageUrl: null,
    });
  });
});

describe("getGraboListingNextPageUrl", () => {
  it("ignores rel=last when rel=next is missing", () => {
    const $ = cheerio.load(`
      <nav class="archive-links pages">
        <a rel="last" href="/en/non-message/page-16">last</a>
      </nav>
    `);
    expect(getGraboListingNextPageUrl($, PAGE1_URL)).toBeNull();
  });
});
