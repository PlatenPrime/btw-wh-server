import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { stripSkuProductCodeFixturePreamble } from "../../../../sku-product-codes/stripSkuProductCodeFixturePreamble.js";
import { readAirProductFromHtml } from "../readAirProductFromHtml.js";

const airFixture = stripSkuProductCodeFixturePreamble(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../sku-product-codes/air-product-code.txt",
    ),
    "utf8",
  ),
);

describe("readAirProductFromHtml", () => {
  it("parses quantity and price", () => {
    const html = `
      <input id="max-product-quantity" value="3" />
      <div class="us-price-actual">100,50 грн</div>
    `;
    expect(readAirProductFromHtml(html)).toEqual({ stock: 3, price: 100.5 });
  });

  it("stock 0 when max qty missing", () => {
    const html = `<div class="us-price-actual">10</div>`;
    expect(readAirProductFromHtml(html)).toEqual({ stock: 0, price: 10 });
  });

  it("parses artikul from fixture", () => {
    const result = readAirProductFromHtml(airFixture);
    expect(result.artikul).toBe("SDR-120");
  });

  it("includes artikul with stock and price when present", () => {
    const html = `
      <input id="max-product-quantity" value="3" />
      <div class="us-price-actual">100</div>
      <span class="us-product-info-code">ABC-1</span>
    `;
    expect(readAirProductFromHtml(html)).toEqual({ stock: 3, price: 100, artikul: "ABC-1" });
  });
});
