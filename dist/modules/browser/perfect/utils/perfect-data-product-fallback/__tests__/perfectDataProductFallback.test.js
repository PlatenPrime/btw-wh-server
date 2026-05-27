import { describe, expect, it } from "vitest";
import { extractDataProductFieldsFromHtmlRegex, extractDataProductFromHtml, tryPerfectDataProductFallback, } from "../perfectDataProductFallback.js";
describe("extractDataProductFromHtml", () => {
    it("parses data-product JSON from product-details", () => {
        const html = `
      <div id="product-details" data-product='{"quantity":5,"price_amount":553,"name":"Товар"}'></div>`;
        expect(extractDataProductFromHtml(html)).toMatchObject({
            quantity: 5,
            price_amount: 553,
            name: "Товар",
        });
    });
});
describe("tryPerfectDataProductFallback", () => {
    it("returns per-piece stock when in stock and data-product has quantity", () => {
        const html = `
      <html><head>
        <meta property="product:availability" content="in_stock" />
      </head><body>
        <h1>Кулька, 50 шт</h1>
        <div id="product-details" data-product='{"quantity":5,"price_amount":553,"name":"Кулька"}'></div>
        <p>Штук в упаковці: 50</p>
      </body></html>`;
        expect(tryPerfectDataProductFallback(html, "Кулька, 50 шт")).toEqual({
            stock: 250,
            price: 11.06,
            title: "Кулька",
            source: "data-product",
        });
    });
    it("uses meta price when data-product has quantity but no price_amount", () => {
        const html = `
      <head><meta property="product:price:amount" content="553" /></head>
      <div id="product-details" data-product='{"quantity":5,"name":"Кулька"}'></div>
      <p>Штук в упаковці: 50</p>`;
        expect(tryPerfectDataProductFallback(html, "Кулька")).toMatchObject({
            stock: 250,
            price: 11.06,
            source: "data-product",
        });
    });
    it("extractDataProductFieldsFromHtmlRegex parses quantity and price_amount", () => {
        const html = 'data-product="{&quot;quantity&quot;:5,&quot;price_amount&quot;:553}"';
        expect(extractDataProductFieldsFromHtmlRegex(html)).toMatchObject({
            quantity: "5",
            price_amount: "553",
        });
    });
    it("returns null when page is OOS", () => {
        const html = `
      <link itemprop="availability" href="https://schema.org/OutOfStock" />
      <div id="product-details" data-product='{"quantity":0,"price_amount":100}'></div>`;
        expect(tryPerfectDataProductFallback(html, "x")).toBeNull();
    });
    it("returns null when data-product is absent", () => {
        expect(tryPerfectDataProductFallback("<html></html>", "x")).toBeNull();
    });
});
