import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractDojdevikPackCount } from "../extractDojdevikPackCount.js";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../sku-pages"
);

describe("extractDojdevikPackCount", () => {
  it("reads pack size from characteristics attribute_value", () => {
    expect(
      extractDojdevikPackCount(
        `Кількість в пачці.</td><td class="b-product-info__cell" data-qaid="attribute_value">100</td>`
      )
    ).toBe(100);
  });

  it("reads pack size from description heading", () => {
    expect(
      extractDojdevikPackCount("<h3>Кількість в упаковці 100 шт.</h3>")
    ).toBe(100);
  });

  it("prefers characteristics over description", () => {
    expect(
      extractDojdevikPackCount(
        `Кількість в пачці.</td><td data-qaid="attribute_value">50</td>` +
          `<h3>Кількість в упаковці 100 шт.</h3>`
      )
    ).toBe(50);
  });

  it("is case-insensitive and tolerates extra spaces in description", () => {
    expect(
      extractDojdevikPackCount("кількість  в   упаковці   50 шт")
    ).toBe(50);
  });

  it("returns 1 when pack text is missing or invalid", () => {
    expect(extractDojdevikPackCount("")).toBe(1);
    expect(extractDojdevikPackCount("<html></html>")).toBe(1);
    expect(extractDojdevikPackCount("Кількість в упаковці 0 шт")).toBe(1);
    expect(
      extractDojdevikPackCount(
        `Кількість в пачці.</td><td data-qaid="attribute_value">0</td>`
      )
    ).toBe(1);
  });

  it("reads pack from sku-page-soldout fixture (пачці only)", () => {
    const html = readFileSync(
      join(fixturesDir, "sku-page-soldout.txt"),
      "utf8"
    );
    expect(extractDojdevikPackCount(html)).toBe(100);
  });

  it("reads pack from sku-page fixture", () => {
    const html = readFileSync(join(fixturesDir, "sku-page.txt"), "utf8");
    expect(extractDojdevikPackCount(html)).toBe(100);
  });

  it("returns 1 for sku-page-sale fixture without pack", () => {
    const html = readFileSync(join(fixturesDir, "sku-page-sale.txt"), "utf8");
    expect(extractDojdevikPackCount(html)).toBe(1);
  });
});
