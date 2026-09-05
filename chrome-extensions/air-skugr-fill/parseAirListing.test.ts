import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { describe, expect, it } from "vitest";
import { parseAirListingFromDocument, isAirListingPayload } from "./parseAirListing.js";

const PAGE_URL =
  "https://air.example.test/ua/index.php?route=product/category&path=1";
const PAGE2_URL = `${PAGE_URL}&page=2`;

function wrapNode($: cheerio.CheerioAPI, el: AnyNode) {
  const $el = $(el);
  return {
    getAttribute(name: string) {
      const value = $el.attr(name);
      return value === undefined ? null : value;
    },
    querySelector(sel: string) {
      const found = $el.find(sel)[0];
      return found ? wrapNode($, found) : null;
    },
    querySelectorAll(sel: string) {
      return $el.find(sel).toArray().map((node) => wrapNode($, node));
    },
    get textContent() {
      return $el.text();
    },
  };
}

function cheerioDocument(html: string) {
  const $ = cheerio.load(html);
  return {
    querySelector(sel: string) {
      const el = $(sel)[0];
      return el ? wrapNode($, el) : null;
    },
    querySelectorAll(sel: string) {
      return $(sel).toArray().map((node) => wrapNode($, node));
    },
  };
}

function airProductCard(opts: {
  pid: string;
  productPath: string;
  imageUrl: string;
  title: string;
}): string {
  return `<div class="product-layout product-grid" data-pid="${opts.pid}">
    <div class="us-module-img">
      <a href="${opts.productPath}">
        <img src="${opts.imageUrl}" alt="" />
      </a>
    </div>
    <div class="us-module-title">
      <a href="${opts.productPath}">${opts.title}</a>
    </div>
  </div>`;
}

function airPageHtml(opts: { cards: string[]; nextHref?: string }): string {
  const next =
    opts.nextHref != null
      ? `<link rel="next" href="${opts.nextHref}" />`
      : "";
  return `<!DOCTYPE html><html><head>${next}</head><body>
    <div class="row us-category-products">${opts.cards.join("")}</div>
  </body></html>`;
}

describe("parseAirListingFromDocument", () => {
  it("parses cards, title, urls, next page", () => {
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "111",
          productPath: "/ua/product/p111",
          imageUrl: "https://air.example.test/image/cache/a.jpg",
          title: "Balloon 10",
        }),
      ],
      nextHref: PAGE2_URL,
    });

    const result = parseAirListingFromDocument(
      cheerioDocument(html),
      PAGE_URL
    );

    expect(result.hasListingMarkup).toBe(true);
    expect(result.nextPageUrl).toBe(PAGE2_URL);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toEqual({
      productId: "111",
      title: "Balloon 10",
      url: "https://air.example.test/ua/product/p111",
      imageUrl: "https://air.example.test/image/cache/a.jpg",
    });
  });

  it("uses data-src when src is lazy placeholder", () => {
    const real = "https://air.example.test/image/cache/catalog/x-228x228.jpg";
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "9",
          productPath: "/ua/product/z",
          imageUrl:
            "https://air.example.test/image/catalog/1lazy/lazy-image.svg",
          title: "Z",
        }).replace(
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg"`,
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg" data-src="${real}"`
        ),
      ],
    });

    const result = parseAirListingFromDocument(
      cheerioDocument(html),
      PAGE_URL
    );
    expect(result.products[0]?.imageUrl).toBe(real);
  });

  it("uses data-srcset when src is lazy placeholder", () => {
    const real = "https://air.example.test/image/cache/catalog/x-228x228.jpg";
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "9",
          productPath: "/ua/product/z",
          imageUrl:
            "https://air.example.test/image/catalog/1lazy/lazy-image.svg",
          title: "Z",
        }).replace(
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg"`,
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg" data-srcset="${real} 100w"`
        ),
      ],
    });

    const result = parseAirListingFromDocument(
      cheerioDocument(html),
      PAGE_URL
    );
    expect(result.products[0]?.imageUrl).toBe(real);
  });

  it("empty grid is listing markup with no products", () => {
    const result = parseAirListingFromDocument(
      cheerioDocument(airPageHtml({ cards: [] })),
      PAGE_URL
    );
    expect(result.hasListingMarkup).toBe(true);
    expect(result.products).toHaveLength(0);
    expect(result.nextPageUrl).toBeNull();
  });

  it("parses cards from #content when category grid is missing", () => {
    const html = `<!DOCTYPE html><html><body>
      <div id="content">
        ${airProductCard({
          pid: "5",
          productPath: "/ua/product/c",
          imageUrl: "https://air.example.test/c.jpg",
          title: "C",
        })}
      </div>
    </body></html>`;
    const result = parseAirListingFromDocument(
      cheerioDocument(html),
      PAGE_URL
    );
    expect(result.hasListingMarkup).toBe(false);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.productId).toBe("5");
  });

  it("skips cards without image title or url", () => {
    const html = airPageHtml({
      cards: [
        `<div class="product-layout" data-pid="1">
          <div class="us-module-title"><a href="/ua/product/p">T</a></div>
        </div>`,
      ],
    });
    const result = parseAirListingFromDocument(
      cheerioDocument(html),
      PAGE_URL
    );
    expect(result.hasListingMarkup).toBe(true);
    expect(result.products).toHaveLength(0);
  });

  it("WAF markup has no listing grid", () => {
    const result = parseAirListingFromDocument(
      cheerioDocument(
        "<!DOCTYPE html><html><body><h1>Захищена сторінка</h1></body></html>"
      ),
      PAGE_URL
    );
    expect(result.hasListingMarkup).toBe(false);
    expect(result.products).toHaveLength(0);
    expect(result.nextPageUrl).toBeNull();
  });

  it("accepts listing payload shape", () => {
    expect(
      isAirListingPayload({
        products: [],
        nextPageUrl: null,
        hasListingMarkup: true,
      })
    ).toBe(true);
    expect(
      isAirListingPayload({
        products: [],
        nextPageUrl: PAGE2_URL,
        hasListingMarkup: false,
      })
    ).toBe(true);
    expect(isAirListingPayload(null)).toBe(false);
    expect(isAirListingPayload({ products: [] })).toBe(false);
    expect(
      isAirListingPayload({
        products: "nope",
        nextPageUrl: null,
        hasListingMarkup: true,
      })
    ).toBe(false);
  });
});
