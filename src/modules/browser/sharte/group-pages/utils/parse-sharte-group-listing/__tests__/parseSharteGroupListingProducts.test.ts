import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import {
  getSharteGroupNextPageUrl,
  parseSharteGroupListingProducts,
} from "../parseSharteGroupListingProducts.js";

describe("parseSharteGroupListingProducts", () => {
  it("parses product cards", () => {
    const html = `
      <div class="items productList">
        <div class="item product sku" data-product-id="42">
          <a class="picture" href="/p42-ball.html">
            <img src="https://cdn.example/ball.jpg" alt="Ball" />
          </a>
          <a class="name" href="/p42-ball.html"><span class="middle">Ball</span></a>
        </div>
      </div>
    `;
    const $ = cheerio.load(html);
    const map = parseSharteGroupListingProducts($, "https://sharte.net/cat/");
    expect(map.get("42")).toEqual({
      productId: "42",
      title: "Ball",
      url: "https://sharte.net/p42-ball.html",
      imageUrl: "https://cdn.example/ball.jpg",
    });
  });

  it("skips cards without image or title", () => {
    const html = `
      <div class="items productList">
        <div class="item product sku" data-product-id="1">
          <a class="picture" href="/p1.html"><img alt="" /></a>
          <a class="name" href="/p1.html"><span class="middle"></span></a>
        </div>
      </div>
    `;
    const $ = cheerio.load(html);
    expect(parseSharteGroupListingProducts($, "https://sharte.net/cat/").size).toBe(
      0
    );
  });
});

describe("getSharteGroupNextPageUrl", () => {
  it("prefers bx-pag-next", () => {
    const $ = cheerio.load(`
      <ul class="bx-pagination">
        <li class="bx-pag-next"><a href="/cat/?PAGEN_1=2">next</a></li>
      </ul>
      <link rel="next" href="/cat/?PAGEN_1=3" />
    `);
    expect(getSharteGroupNextPageUrl($, "https://sharte.net/cat/")).toBe(
      "https://sharte.net/cat/?PAGEN_1=2"
    );
  });

  it("falls back to link rel=next", () => {
    const $ = cheerio.load(`<link rel="next" href="/cat/?page=2" />`);
    expect(getSharteGroupNextPageUrl($, "https://sharte.net/cat/")).toBe(
      "https://sharte.net/cat/?page=2"
    );
  });
});
