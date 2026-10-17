import { describe, expect, it } from "vitest";
import {
  extractDataProductFieldsFromHtmlRegex,
  extractDataProductFromHtml,
  tryPerfectDataProductFallback,
} from "../perfectDataProductFallback.js";

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

  it("returns null when page is OOS and quantity is 0", () => {
    const html = `
      <link itemprop="availability" href="https://schema.org/OutOfStock" />
      <div id="product-details" data-product='{"quantity":0,"price_amount":100}'></div>`;
    expect(tryPerfectDataProductFallback(html, "x")).toBeNull();
  });

  it("returns quantity when data-product has stock despite OOS marker", () => {
    const html = `
      <link itemprop="availability" href="https://schema.org/OutOfStock" />
      <div id="product-details" data-product='{"quantity":5,"price_amount":100,"name":"Кулька"}'></div>`;
    expect(tryPerfectDataProductFallback(html, "x")).toMatchObject({
      stock: 5,
      price: 100,
      title: "Кулька",
      source: "data-product",
    });
  });

  it("returns null when data-product is absent", () => {
    expect(tryPerfectDataProductFallback("<html></html>", "x")).toBeNull();
  });

  it("does not glue pack 1 with 100 мл description into stock×1100", () => {
    const html = `
      <section id="main">
        <div id="product-details" data-product='{"quantity":489,"price_amount":89,"name":"Концентровні бульбашки, 100 мл. (1:4)"}'></div>
        <div class="infoblock"><p class="infoblock_pp">Штук в упаковці: 1</p></div>
        <div class="product-description">100 мл концентрату додати 400 мл води. Незалишає плям на одязі.</div>
      </section>`;
    expect(tryPerfectDataProductFallback(html, "Концентровні бульбашки, 100 мл. (1:4)")).toEqual({
      stock: 489,
      price: 89,
      title: "Концентровні бульбашки, 100 мл. (1:4)",
      source: "data-product",
    });
  });

  it("does not apply related miniature pack to main product without фасовка", () => {
    const html = `
      <section id="main">
        <div id="product-details" data-product='{"quantity":1,"price_amount":68.5,"name":"Повітряна кулька Art Show Небесний блакитний 36\\" (90 см)"}'></div>
        <article class="product-miniature js-product-miniature">
          <p class="infoblock_p">Штук в упаковці: 100</p>
        </article>
        <article class="product-miniature js-product-miniature">
          <p class="infoblock_p">Штук в упаковці: 50</p>
        </article>
      </section>`;
    expect(
      tryPerfectDataProductFallback(html, 'Кулька-гігант Небесний 36" (90 см) Perfect Party'),
    ).toEqual({
      stock: 1,
      price: 68.5,
      title: 'Повітряна кулька Art Show Небесний блакитний 36" (90 см)',
      source: "data-product",
    });
  });
});
