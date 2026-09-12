import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSvbumProductHtml } from "../parseSvbumProductHtml.js";
import { SVBUM_NEGATIVE_OUTCOME } from "../../svbum-product-types/svbumProductInfo.js";

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../product-pages"
);

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

function simpleProductHtml(opts: {
  title: string;
  price: string;
  special?: string;
  qty: string;
}): string {
  const priceSpan = opts.special
    ? `<span class="price-old text-through"><span data-price="${opts.price}" class="calc-price">${opts.price} грн</span></span>
       <span class="price-new"><span data-special="${opts.special}" class="calc-special">${opts.special} грн</span></span>`
    : `<span class="price-new"><span data-price="${opts.price}" class="calc-price">${opts.price} грн</span></span>`;

  return `<!DOCTYPE html><html><body>
<h1 class="page-title">${opts.title}</h1>
<div id="product">
  <div class="product-control-price">
    <div class="price">${priceSpan}</div>
  </div>
  <input type="hidden" data-product-quantity="${opts.qty}" data-available-text="Доступно: ">
</div>
<div class="product-related">
  <span class="price-new"><span data-price="1.00" class="calc-price">1.00 грн</span></span>
  <input type="hidden" data-product-quantity="999" />
</div>
</body></html>`;
}

function optionsProductHtml(opts: {
  title: string;
  options: Array<{
    name: string;
    qty: string;
    price: string;
    special?: string;
  }>;
}): string {
  const radios = opts.options
    .map((option) => {
      const specialAttr =
        option.special !== undefined ? ` data-special="${option.special}"` : "";
      return `<label class="product-option-card">
        <input type="radio" name="option[1]" data-price="${option.price}"${specialAttr} data-option-quantity="${option.qty}" />
        <span class="product-option--name">${option.name}</span>
      </label>`;
    })
    .join("");

  return `<!DOCTYPE html><html><body>
<h1 class="page-title">${opts.title}</h1>
<div id="product">
  <div class="product-options-list">${radios}</div>
  <div class="product-control-price">
    <div class="price">
      <span class="price-new"><span data-price="${opts.options[0]?.price ?? "0"}" class="calc-price">x</span></span>
    </div>
  </div>
</div>
<div class="product-related">
  <div class="product-options-list">
    <label>
      <input type="radio" name="option999[1]" data-price="1.00" data-option-quantity="50" />
      <span class="product-option--name">упаковка (100шт)</span>
    </label>
  </div>
</div>
</body></html>`;
}

describe("parseSvbumProductHtml", () => {
  it("page-1: simple in-stock, 18\" is not pack count, recommendations ignored", () => {
    const result = parseSvbumProductHtml(readFixture("product-page-1.txt"));
    expect(result).toMatchObject({ stock: 43, price: 11.77 });
    expect(result.title).toContain("AS-10015");
  });

  it("page-2: simple in-stock, 100г is not pack count", () => {
    const result = parseSvbumProductHtml(readFixture("product-page-2.txt"));
    expect(result).toMatchObject({ stock: 2, price: 61 });
  });

  it("page-3-sale: min per-piece among in-stock, stock is sum of pieces", () => {
    const result = parseSvbumProductHtml(readFixture("product-page-3-sale.txt"));
    expect(result).toMatchObject({ stock: 300, price: 3.93 });
  });

  it("page-4-soldout: stock 0, per-piece from OOS pack", () => {
    const result = parseSvbumProductHtml(readFixture("product-page-4-soldout.txt"));
    expect(result).toMatchObject({ stock: 0, price: 3.34 });
  });

  it("title 10 шт without options: divides price and multiplies stock", () => {
    const result = parseSvbumProductHtml(
      simpleProductHtml({
        title: 'Серветки "Горох" 10 шт',
        price: "74.50",
        qty: "16",
      })
    );
    expect(result).toMatchObject({ stock: 160, price: 7.45 });
  });

  it("title 10 шт with pack options: divides only by option pack", () => {
    const result = parseSvbumProductHtml(
      optionsProductHtml({
        title: 'Серветки "Горох" 10 шт',
        options: [
          { name: "упаковка (20шт)", qty: "5", price: "100", special: "94.4475" },
          { name: "упаковка (100шт)", qty: "2", price: "500", special: "393.225" },
        ],
      })
    );
    expect(result).toMatchObject({ stock: 300, price: 3.93 });
  });

  it("mixed in-stock/OOS: min and sum only over in-stock packs", () => {
    const result = parseSvbumProductHtml(
      optionsProductHtml({
        title: "Латексні кульки",
        options: [
          { name: "упаковка (20шт)", qty: "5", price: "137.4950", special: "94.4475" },
          { name: "упаковка (100шт)", qty: "0", price: "572.4500", special: "393.225" },
        ],
      })
    );
    expect(result).toMatchObject({ stock: 100, price: 4.72 });
  });

  it("simple sale uses data-special from price-new", () => {
    const result = parseSvbumProductHtml(
      simpleProductHtml({
        title: "Товар без фасовки",
        price: "137.4950",
        special: "94.4475",
        qty: "3",
      })
    );
    expect(result).toMatchObject({ stock: 3, price: 94.45 });
  });

  it("returns -1,-1 without #product", () => {
    expect(parseSvbumProductHtml("<html><body><h1 class='page-title'>X</h1></body></html>")).toEqual(
      SVBUM_NEGATIVE_OUTCOME
    );
  });

  it("returns -1,-1 when #product has no price", () => {
    const html = `<html><body>
      <h1 class="page-title">X</h1>
      <div id="product"><input type="hidden" data-product-quantity="2"></div>
    </body></html>`;
    expect(parseSvbumProductHtml(html)).toEqual(SVBUM_NEGATIVE_OUTCOME);
  });

  it("returns -1,-1 for empty HTML", () => {
    expect(parseSvbumProductHtml("")).toEqual(SVBUM_NEGATIVE_OUTCOME);
  });
});
