import { describe, expect, it } from "vitest";
import { parseAirGroupListingPage } from "../parseAirGroupListingPage.js";

const PAGE_URL =
  "https://air.example.test/ua/index.php?route=product/category&path=1";
const PAGE2_URL = `${PAGE_URL}&page=2`;

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

function airPageHtml(opts: {
  cards: string[];
  nextHref?: string;
}): string {
  const next =
    opts.nextHref != null
      ? `<link rel="next" href="${opts.nextHref}" />`
      : "";
  const grid = opts.cards.join("");
  return `<!DOCTYPE html><html><head>${next}</head><body>
    <div class="row us-category-products">${grid}</div>
  </body></html>`;
}

describe("parseAirGroupListingPage", () => {
  it("parses cards, decodes title, resolves urls", () => {
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "111",
          productPath: "/ua/product/p111",
          imageUrl: "https://air.example.test/image/cache/a.jpg",
          title: "Balloon &#34;10&quot;",
        }),
      ],
      nextHref: PAGE2_URL,
    });

    const result = parseAirGroupListingPage(html, PAGE_URL);

    expect(result.hasListingMarkup).toBe(true);
    expect(result.nextPageUrl).toBe(PAGE2_URL);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.productId).toBe("111");
    expect(result.products[0]?.url).toBe(
      "https://air.example.test/ua/product/p111"
    );
    expect(result.products[0]?.title).not.toContain("&#");
    expect(result.products[0]?.title).toContain("10");
  });

  it("uses data-src when src is lazy placeholder", () => {
    const real =
      "https://air.example.test/image/cache/catalog/x-228x228.jpg";
    const html = airPageHtml({
      cards: [
        airProductCard({
          pid: "8",
          productPath: "/ua/product/y",
          imageUrl:
            "https://air.example.test/image/catalog/1lazy/lazy-image.svg",
          title: "Y",
        }).replace(
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg"`,
          `src="https://air.example.test/image/catalog/1lazy/lazy-image.svg" data-src="${real}"`
        ),
      ],
    });

    const result = parseAirGroupListingPage(html, PAGE_URL);
    expect(result.products[0]?.imageUrl).toBe(real);
  });

  it("uses data-srcset when src is lazy placeholder", () => {
    const real =
      "https://air.example.test/image/cache/catalog/x-228x228.jpg";
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

    const result = parseAirGroupListingPage(html, PAGE_URL);
    expect(result.products[0]?.imageUrl).toBe(real);
  });

  it("empty grid is listing markup with no products", () => {
    const html = airPageHtml({ cards: [] });
    const result = parseAirGroupListingPage(html, PAGE_URL);
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
    const result = parseAirGroupListingPage(html, PAGE_URL);
    expect(result.hasListingMarkup).toBe(false);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.productId).toBe("5");
  });

  it("WAF / empty markup has no listing grid", () => {
    const html =
      "<!DOCTYPE html><html><body><h1>Захищена сторінка</h1></body></html>";
    const result = parseAirGroupListingPage(html, PAGE_URL);
    expect(result.hasListingMarkup).toBe(false);
    expect(result.products).toHaveLength(0);
    expect(result.nextPageUrl).toBeNull();
  });
});
