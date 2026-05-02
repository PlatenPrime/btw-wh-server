import { describe, expect, it } from "vitest";
import { readAirProductFromHtml } from "../readAirProductFromHtml.js";
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
});
