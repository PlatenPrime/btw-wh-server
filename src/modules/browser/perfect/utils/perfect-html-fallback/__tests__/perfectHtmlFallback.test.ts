import { describe, expect, it } from "vitest";
import { tryPerfectHtmlFallback } from "../perfectHtmlFallback.js";

describe("tryPerfectHtmlFallback", () => {
  it("returns per-piece OOS result when page is OOS and price in meta", () => {
    const html = `
      <html><head>
        <meta property="product:price:amount" content="331">
        <link itemprop="availability" href="https://schema.org/OutOfStock" />
      </head><body><h1>Кулька латексна, 50 шт.</h1></body></html>`;
    expect(tryPerfectHtmlFallback(html, "Кулька латексна, 50 шт.")).toEqual({
      stock: 0,
      price: 6.62,
      title: "Кулька латексна, 50 шт.",
    });
  });

  it("returns null when page looks in stock", () => {
    const html = `
      <meta property="product:availability" content="in_stock" />
      <meta property="product:price:amount" content="100" />`;
    expect(tryPerfectHtmlFallback(html, "x")).toBeNull();
  });
});
