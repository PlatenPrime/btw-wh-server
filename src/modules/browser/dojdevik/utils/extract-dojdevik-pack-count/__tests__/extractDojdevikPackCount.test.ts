import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractDojdevikPackCount } from "../extractDojdevikPackCount.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../../sku-pages");

function attrRow(name: string, value: string): string {
  return (
    `<td class="b-product-info__cell" data-qaid="attribute_name">${name}</td>` +
    `<td class="b-product-info__cell" data-qaid="attribute_value">${value}</td>`
  );
}

/** Сниппет attrs фонтана: набір 6 шт. + коробка 100 (regression). */
const FOUNTAIN_ATTRS_SNIPPET =
  attrRow("Вид свічки", "Свічка-феєрверк") +
  attrRow("Кількість свічок в наборі", "6 шт.") +
  attrRow("Висота свічки", "120 мм") +
  attrRow("Кількість у коробці", "100");

describe("extractDojdevikPackCount", () => {
  it("reads pack size from characteristics attribute_value", () => {
    expect(extractDojdevikPackCount(attrRow("Кількість в пачці.", "100"))).toBe(100);
  });

  it("reads pack size from attribute named кількість в упаковці", () => {
    expect(extractDojdevikPackCount(attrRow("кількість в упаковці", "100"))).toBe(100);
  });

  it("reads pack size from lowercase attribute name with кількість", () => {
    expect(extractDojdevikPackCount(attrRow("кількість в пачці.", "50"))).toBe(50);
  });

  it("reads pack size from наборі with N шт. value", () => {
    expect(extractDojdevikPackCount(attrRow("Кількість свічок в наборі", "6 шт."))).toBe(6);
  });

  it("prefers наборі over коробці when both present", () => {
    expect(
      extractDojdevikPackCount(
        attrRow("Кількість свічок в наборі", "6 шт.") + attrRow("Кількість у коробці", "100"),
      ),
    ).toBe(6);
  });

  it("ignores коробці alone and falls back to 1", () => {
    expect(extractDojdevikPackCount(attrRow("Кількість у коробці", "100"))).toBe(1);
  });

  it("reads pack size from title по N штук у пакованні", () => {
    expect(
      extractDojdevikPackCount(
        '<span data-qaid="product_name">Фонтан, 12 см. по 6 штук у пакованні</span>',
      ),
    ).toBe(6);
  });

  it("reads pack size from title (N шт)", () => {
    expect(extractDojdevikPackCount("<h1>Товар (10 шт)</h1>")).toBe(10);
  });

  it("prefers characteristics over title", () => {
    expect(
      extractDojdevikPackCount(
        attrRow("Кількість в пачці.", "50") +
          '<span data-qaid="product_name">Товар по 6 штук у пакованні</span>',
      ),
    ).toBe(50);
  });

  it("reads pack from fountain attrs snippet (набір 6, ignore коробка 100)", () => {
    expect(extractDojdevikPackCount(FOUNTAIN_ATTRS_SNIPPET)).toBe(6);
  });

  it("reads pack size from description heading", () => {
    expect(extractDojdevikPackCount("<h3>Кількість в упаковці 100 шт.</h3>")).toBe(100);
  });

  it("prefers characteristics over description", () => {
    expect(
      extractDojdevikPackCount(
        attrRow("Кількість в пачці.", "50") + `<h3>Кількість в упаковці 100 шт.</h3>`,
      ),
    ).toBe(50);
  });

  it("is case-insensitive and tolerates extra spaces in description", () => {
    expect(extractDojdevikPackCount("кількість  в   упаковці   50 шт")).toBe(50);
  });

  it("returns 1 when pack text is missing or invalid", () => {
    expect(extractDojdevikPackCount("")).toBe(1);
    expect(extractDojdevikPackCount("<html></html>")).toBe(1);
    expect(extractDojdevikPackCount("Кількість в упаковці 0 шт")).toBe(1);
    expect(extractDojdevikPackCount(attrRow("Кількість в пачці.", "0"))).toBe(1);
    expect(extractDojdevikPackCount(attrRow("Кількість в наявності", "Є на складі"))).toBe(1);
  });

  it("reads pack from sku-page-soldout fixture (пачці only)", () => {
    const html = readFileSync(join(fixturesDir, "sku-page-soldout.txt"), "utf8");
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
