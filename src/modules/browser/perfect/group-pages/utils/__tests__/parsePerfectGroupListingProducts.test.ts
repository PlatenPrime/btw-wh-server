import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parsePerfectGroupListingProducts } from "../parsePerfectGroupListingProducts.js";

const BASE = "https://perfectparty.in.ua/category/balloons";

function listingHtml(cards: string): string {
  return `<html><body>${cards}</body></html>`;
}

describe("parsePerfectGroupListingProducts", () => {
  it("parses product cards with id, title, url and image", () => {
    const html = listingHtml(`
      <article class="product-miniature js-product-miniature" data-id-product="123">
        <a class="thumbnail product-thumbnail" href="/123-balloon-set.html">
          <img alt="Balloon Set" src="/img/balloon.jpg" />
        </a>
      </article>
    `);
    const $ = cheerio.load(html);
    const result = parsePerfectGroupListingProducts($, BASE);

    expect(result.size).toBe(1);
    const product = result.get("123");
    expect(product).toMatchObject({
      productId: "123",
      title: "Balloon Set",
      url: "https://perfectparty.in.ua/123-balloon-set.html",
      imageUrl: "https://perfectparty.in.ua/img/balloon.jpg",
    });
  });

  it("skips cards without title or image", () => {
    const html = listingHtml(`
      <article class="product-miniature js-product-miniature" data-id-product="1">
        <a class="thumbnail product-thumbnail" href="/1-item.html">
          <img alt="" src="" />
        </a>
      </article>
      <article class="product-miniature js-product-miniature" data-id-product="2">
        <a class="thumbnail product-thumbnail" href="">
          <img alt="No link" src="/img/x.jpg" />
        </a>
      </article>
    `);
    const $ = cheerio.load(html);
    const result = parsePerfectGroupListingProducts($, BASE);
    expect(result.size).toBe(0);
  });

  it("deduplicates by productId", () => {
    const html = listingHtml(`
      <article class="product-miniature js-product-miniature" data-id-product="99">
        <a class="thumbnail product-thumbnail" href="/99-first.html">
          <img alt="First" src="/img/a.jpg" />
        </a>
      </article>
      <article class="product-miniature js-product-miniature" data-id-product="99">
        <a class="thumbnail product-thumbnail" href="/99-second.html">
          <img alt="Second" src="/img/b.jpg" />
        </a>
      </article>
    `);
    const $ = cheerio.load(html);
    const result = parsePerfectGroupListingProducts($, BASE);
    expect(result.size).toBe(1);
    expect(result.get("99")?.title).toBe("Second");
  });
});
