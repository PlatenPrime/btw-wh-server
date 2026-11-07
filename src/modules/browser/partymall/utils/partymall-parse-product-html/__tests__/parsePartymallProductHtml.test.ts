import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { stripSkuProductCodeFixturePreamble } from "../../../../sku-product-codes/stripSkuProductCodeFixturePreamble.js";
import { parsePartymallProductHtml } from "../parsePartymallProductHtml.js";
import { PARTYMALL_NEGATIVE_OUTCOME } from "../../partymall-product-types/partymallProductInfo.js";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../../sku-pages");

function readFixture(name: string): string {
  return stripSkuProductCodeFixturePreamble(readFileSync(join(FIXTURES_DIR, name), "utf8"));
}

describe("parsePartymallProductHtml", () => {
  it("sku-page: in-stock with pack divides price, stock as-is", () => {
    const result = parsePartymallProductHtml(readFixture("sku-page.txt"));
    expect(result).toMatchObject({ stock: 23, price: 1.7, artikul: "G90 01" });
    expect(result.title).toContain("Gemar");
  });

  it("sku-page-sale: uses sale price / pack", () => {
    const result = parsePartymallProductHtml(readFixture("sku-page-sale.txt"));
    expect(result).toMatchObject({ stock: 2, price: 5.29, artikul: "3256-0003" });
  });

  it("sku-page-soldout: stock 0 with per-piece price", () => {
    const result = parsePartymallProductHtml(readFixture("sku-page-soldout.txt"));
    expect(result).toMatchObject({ stock: 0, price: 1.7, artikul: "G90 43" });
  });

  it("sku-page-wholesale: base price, ignores wholesale tiers, no pack", () => {
    const result = parsePartymallProductHtml(readFixture("sku-page-wholesale.txt"));
    expect(result).toMatchObject({ stock: 100, price: 28.2, artikul: "3381-0066" });
  });

  it("packed-without-pack-count: does not guess pack from title", () => {
    const result = parsePartymallProductHtml(
      readFixture("sku-page-packed-but-without-pack-count.txt"),
    );
    expect(result).toMatchObject({
      stock: 24,
      price: 282,
      artikul: "держатель больш белый",
    });
  });

  it("returns -1,-1 without #product", () => {
    expect(parsePartymallProductHtml("<html><body><h1>X</h1></body></html>")).toEqual(
      PARTYMALL_NEGATIVE_OUTCOME,
    );
  });

  it("returns -1,-1 when #product has no price", () => {
    const html = `<html><body>
      <div id="product">
        <h1>X</h1>
        <div class="ds-product-main-stock green-text">В наявності: 3</div>
      </div>
    </body></html>`;
    expect(parsePartymallProductHtml(html)).toEqual(PARTYMALL_NEGATIVE_OUTCOME);
  });

  it("returns -1,-1 for empty HTML", () => {
    expect(parsePartymallProductHtml("")).toEqual(PARTYMALL_NEGATIVE_OUTCOME);
  });

  it("ignores related product prices outside main price block", () => {
    const html = `<html><body>
      <div id="product">
        <h1>Main</h1>
        <span id="product-model-1">ART-1</span>
        <div class="ds-product-main-stock green-text">В наявності: 5</div>
        <div class="ds-product-main-price"><div class="ds-price-new">10.00 грн</div></div>
        <div class="ds-module-price"><div class="ds-price-new">999.00 грн</div></div>
      </div>
      <div class="ds-product-attributes-item">
        <div class="secondary-text"><span>Кількість в упаковці.</span></div>
        <span class="fw-500">10</span>
      </div>
    </body></html>`;
    expect(parsePartymallProductHtml(html)).toMatchObject({
      stock: 5,
      price: 1,
      artikul: "ART-1",
    });
  });
});
