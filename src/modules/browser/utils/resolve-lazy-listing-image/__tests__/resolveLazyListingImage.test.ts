import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { resolveLazyListingImage } from "../resolveLazyListingImage.js";

describe("resolveLazyListingImage", () => {
  it("prefers non-lazy src", () => {
    const $ = cheerio.load(
      `<img src="https://cdn.example/a.jpg" data-srcset="https://cdn.example/b.jpg 1x" />`
    );
    expect(resolveLazyListingImage($("img"), "https://shop.ua/list")).toBe(
      "https://cdn.example/a.jpg"
    );
  });

  it("uses data-srcset when src is lazy placeholder", () => {
    const $ = cheerio.load(
      `<img src="/lazy-image.svg" data-srcset="/img/real.jpg 1x" />`
    );
    expect(resolveLazyListingImage($("img"), "https://shop.ua/list")).toBe(
      "https://shop.ua/img/real.jpg"
    );
  });

  it("uses data-src when preferDataSrc and srcset missing", () => {
    const $ = cheerio.load(
      `<img src="/lazy-image.svg" data-src="/img/from-data.jpg" />`
    );
    expect(
      resolveLazyListingImage($("img"), "https://shop.ua/list", {
        preferDataSrc: true,
      })
    ).toBe("https://shop.ua/img/from-data.jpg");
  });

  it("falls back to lazy src when no alternatives", () => {
    const $ = cheerio.load(`<img src="/lazy-image.svg" />`);
    expect(resolveLazyListingImage($("img"), "https://shop.ua/list")).toBe(
      "https://shop.ua/lazy-image.svg"
    );
  });

  it("returns null without src", () => {
    const $ = cheerio.load(`<img alt="x" />`);
    expect(resolveLazyListingImage($("img"), "https://shop.ua/list")).toBeNull();
  });
});
