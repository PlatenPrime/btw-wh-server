import { describe, expect, it } from "vitest";
import {
  extractDisplayPriceFromProductHtml,
  isPerfectProductPageOutOfStock,
} from "../perfectProductPagePrice.js";

describe("extractDisplayPriceFromProductHtml", () => {
  it("reads product:price:amount meta", () => {
    const html = `<head><meta property="product:price:amount" content="331"></head>`;
    expect(extractDisplayPriceFromProductHtml(html)).toBe(331);
  });

  it("reads price_amount from embedded JSON", () => {
    const html = `<script>"price_amount": 12.5</script>`;
    expect(extractDisplayPriceFromProductHtml(html)).toBe(12.5);
  });
});

describe("isPerfectProductPageOutOfStock", () => {
  it("detects OutOfStock schema link", () => {
    const html = `
      <link itemprop="availability" href="https://schema.org/OutOfStock" />`;
    expect(isPerfectProductPageOutOfStock(html)).toBe(true);
  });

  it("detects in_stock meta as not OOS", () => {
    const html = `
      <meta property="product:availability" content="in_stock" />
      <meta property="product:price:amount" content="100" />`;
    expect(isPerfectProductPageOutOfStock(html)).toBe(false);
  });
});
