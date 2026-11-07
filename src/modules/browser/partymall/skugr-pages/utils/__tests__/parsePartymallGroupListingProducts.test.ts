import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parsePartymallGroupListingProducts } from "../parsePartymallGroupListingProducts.js";

const BASE =
  "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?ocf=F31S2V3127113339";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../..");

function listingHtml(cards: string): string {
  return `<html><body><div class="ds-category-products">${cards}</div></body></html>`;
}

function card(opts: { productId: string; href: string; title: string; imageSrc: string }): string {
  return `<div class="ds-module-item product-layout" data-pid="${opts.productId}">
    <div class="ds-module-img-box">
      <img src="${opts.imageSrc}" alt="${opts.title}" title="${opts.title}" />
    </div>
    <a href="${opts.href}" class="ds-module-title">${opts.title}</a>
  </div>`;
}

function readFixtureHtml(name: string): string {
  const raw = readFileSync(join(FIXTURES_DIR, name), "utf8");
  const idx = raw.indexOf("<!DOCTYPE");
  return idx >= 0 ? raw.slice(idx) : raw;
}

describe("parsePartymallGroupListingProducts", () => {
  it("parses product cards with id, title, url and image", () => {
    const html = listingHtml(
      card({
        productId: "1064",
        href: "/vozdushnyje-shary-item-a",
        title: "Balloon Set",
        imageSrc: "/image/a.webp",
      }),
    );
    const $ = cheerio.load(html);
    const result = parsePartymallGroupListingProducts($, BASE);

    expect(result.size).toBe(1);
    expect(result.get("1064")).toMatchObject({
      productId: "1064",
      title: "Balloon Set",
      url: "https://partymall.ua/vozdushnyje-shary-item-a",
      imageUrl: "https://partymall.ua/image/a.webp",
    });
  });

  it("skips data-pid=0000 header row", () => {
    const html = listingHtml(
      `${card({
        productId: "0000",
        href: "/header",
        title: "Header",
        imageSrc: "/image/h.webp",
      })}${card({
        productId: "1064",
        href: "/item",
        title: "Real",
        imageSrc: "/image/r.webp",
      })}`,
    );
    const $ = cheerio.load(html);
    const result = parsePartymallGroupListingProducts($, BASE);
    expect(result.size).toBe(1);
    expect(result.has("1064")).toBe(true);
  });

  it("decodes HTML entities in title", () => {
    const html = listingHtml(
      card({
        productId: "1",
        href: "https://partymall.ua/p/1",
        title: "Кульки 5&quot; пастель",
        imageSrc: "https://partymall.ua/img/1.webp",
      }),
    );
    const $ = cheerio.load(html);
    const result = parsePartymallGroupListingProducts($, BASE);
    expect(result.get("1")?.title).toBe('Кульки 5" пастель');
    expect(result.get("1")?.title).not.toContain("&quot;");
  });

  it("skugr1-page-1 fixture: 24 products, skips 0000", () => {
    const $ = cheerio.load(readFixtureHtml("skugr1-page-1.txt"));
    const result = parsePartymallGroupListingProducts($, BASE);
    expect(result.size).toBe(24);
    expect(result.has("0000")).toBe(false);
    expect(result.get("1064")).toMatchObject({
      productId: "1064",
      title: expect.stringContaining("Belbal"),
    });
  });

  it("skugr1-page-2-last fixture: 1 product", () => {
    const $ = cheerio.load(readFixtureHtml("skugr1-page-2-last.txt"));
    const result = parsePartymallGroupListingProducts($, BASE);
    expect(result.size).toBe(1);
  });

  it("skugr2-page-3-404: empty, ignores sidebar widgets", () => {
    const $ = cheerio.load(readFixtureHtml("skugr2-page-3-404.txt"));
    const result = parsePartymallGroupListingProducts(
      $,
      "https://partymall.ua/svjech-prazdn-chnyje/svjech-klass-chjesk-je?ocf=F21S2V3896588435&page=3",
    );
    expect(result.size).toBe(0);
  });
});
