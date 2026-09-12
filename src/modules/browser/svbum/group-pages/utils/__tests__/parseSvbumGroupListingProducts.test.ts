import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parseSvbumGroupListingProducts } from "../parseSvbumGroupListingProducts.js";

const BASE =
  "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?ocf=F2S2V1646816252F6S2V1054752947";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../..");

function listingHtml(cards: string): string {
  return `<html><body><ul class="row">${cards}</ul></body></html>`;
}

function card(opts: {
  productId: string;
  href: string;
  title: string;
  imageSrc: string;
  hasOptions?: boolean;
}): string {
  const thumbClass =
    opts.hasOptions === false
      ? `product${opts.productId} product-thumb transition`
      : `has-options product92${opts.productId} product-thumb transition`;
  return `<li class="product-layout product-grid col-product-list">
  <div class="${thumbClass}">
    <div class="image"><img src="${opts.imageSrc}" alt="${opts.title}" title="${opts.title}" class="img-responsive"/></div>
    <div class="product-title"><a href="${opts.href}">${opts.title}</a></div>
    <button class="btn btn-red" type="button" data-p_id="${opts.productId}">Купити</button>
  </div>
</li>`;
}

function readFixtureHtml(name: string): string {
  const raw = readFileSync(join(FIXTURES_DIR, name), "utf8");
  const idx = raw.indexOf("<!DOCTYPE");
  return idx >= 0 ? raw.slice(idx) : raw;
}

describe("parseSvbumGroupListingProducts", () => {
  it("parses product cards with id, title, url and image", () => {
    const html = listingHtml(
      card({
        productId: "10314",
        href: "/povitryani-kuli/lateksni-kulki/item-a",
        title: "Balloon Set",
        imageSrc: "/image/a.webp",
      })
    );
    const $ = cheerio.load(html);
    const result = parseSvbumGroupListingProducts($, BASE);

    expect(result.size).toBe(1);
    expect(result.get("10314")).toMatchObject({
      productId: "10314",
      title: "Balloon Set",
      url: "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/item-a",
      imageUrl: "https://sviatobum.ua/image/a.webp",
    });
  });

  it("decodes HTML entities in title", () => {
    const html = listingHtml(
      card({
        productId: "1",
        href: "https://sviatobum.ua/p/1",
        title: "Кульки 5&quot; пастель",
        imageSrc: "https://sviatobum.ua/img/1.webp",
      })
    );
    const $ = cheerio.load(html);
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.get("1")?.title).toBe('Кульки 5" пастель');
    expect(result.get("1")?.title).not.toContain("&quot;");
  });

  it("parses OOS cards without has-options", () => {
    const html = listingHtml(
      card({
        productId: "4990",
        href: "https://sviatobum.ua/p/oos",
        title: "Sold out balloon",
        imageSrc: "https://sviatobum.ua/img/oos.webp",
        hasOptions: false,
      })
    );
    const $ = cheerio.load(html);
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.get("4990")).toMatchObject({
      productId: "4990",
      title: "Sold out balloon",
      url: "https://sviatobum.ua/p/oos",
      imageUrl: "https://sviatobum.ua/img/oos.webp",
    });
  });

  it("skips cards without title, url, image or data-p_id", () => {
    const html = listingHtml(`
      <li class="product-layout"><div class="product-thumb">
        <div class="image"><img src="" alt="" /></div>
        <div class="product-title"><a href="/p/1">Has id no image</a></div>
        <button data-p_id="1">Купити</button>
      </div></li>
      <li class="product-layout"><div class="product-thumb">
        <div class="image"><img src="/img/x.webp" alt="No link" /></div>
        <div class="product-title"><a href="">No link</a></div>
        <button data-p_id="2">Купити</button>
      </div></li>
      <li class="product-layout"><div class="product-thumb">
        <div class="image"><img src="/img/y.webp" alt="" /></div>
        <div class="product-title"><a href="/p/3"></a></div>
        <button data-p_id="3">Купити</button>
      </div></li>
      <li class="product-layout"><div class="product-thumb">
        <div class="image"><img src="/img/z.webp" alt="No id" /></div>
        <div class="product-title"><a href="/p/4">No id</a></div>
        <button>Купити</button>
      </div></li>
    `);
    const $ = cheerio.load(html);
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.size).toBe(0);
  });

  it("does not use concatenated productNNNN class as productId", () => {
    const html = listingHtml(`
      <li class="product-layout"><div class="has-options product9210314 product-thumb">
        <div class="image"><img src="https://sviatobum.ua/img/a.webp" alt="A" /></div>
        <div class="product-title"><a href="https://sviatobum.ua/p/a">A</a></div>
        <button data-p_id="10314">Купити</button>
      </div></li>
    `);
    const $ = cheerio.load(html);
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.has("9210314")).toBe(false);
    expect(result.has("10314")).toBe(true);
  });

  it("deduplicates by data-p_id", () => {
    const html = listingHtml(
      card({
        productId: "99",
        href: "https://sviatobum.ua/p/first",
        title: "First",
        imageSrc: "https://sviatobum.ua/img/a.webp",
      }) +
        card({
          productId: "99",
          href: "https://sviatobum.ua/p/second",
          title: "Second",
          imageSrc: "https://sviatobum.ua/img/b.webp",
        })
    );
    const $ = cheerio.load(html);
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.size).toBe(1);
    expect(result.get("99")?.title).toBe("Second");
  });

  it("parses group-page-1 fixture", () => {
    const $ = cheerio.load(readFixtureHtml("group-page-1.txt"));
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.size).toBeGreaterThan(0);
    const product = result.get("10314");
    expect(product).toMatchObject({
      productId: "10314",
      url: "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/lateksni-kulki-5-pastel-108-pudrovo-blakitniy-gemar",
      imageUrl:
        "https://sviatobum.ua/image/cache/webp/import_files/20/202aeb56-1754-11f1-b18d-e89c25ddd88b-189x189.webp",
    });
    expect(product?.title).toContain("пудрово-блакитний");
    expect(product?.title).toContain('5"');
    expect($('link[rel="next"]').attr("href")).toContain("page=2");
  });

  it("parses group-page-2 fixture", () => {
    const $ = cheerio.load(readFixtureHtml("group-page-2.txt"));
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.size).toBeGreaterThan(0);
    expect(result.has("5014")).toBe(true);
    expect(result.has("945014")).toBe(false);
    expect($('link[rel="next"]').attr("href")).toContain("page=3");
  });

  it("parses group-page-3-last fixture including OOS and without rel=next", () => {
    const $ = cheerio.load(readFixtureHtml("group-page-3-last.txt"));
    const result = parseSvbumGroupListingProducts($, BASE);
    expect(result.size).toBeGreaterThan(0);
    expect($('link[rel="next"]').length).toBe(0);
    const oos = result.get("4990");
    expect(oos).toMatchObject({
      productId: "4990",
      url: "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/lateksni-kulki-5-pastel-06-rozheviy-gemar",
    });
    expect(oos?.title).toContain("рожевий");
  });
});
