import { describe, expect, it } from "vitest";
import { legacyExtractDojdevikPackCount } from "../legacyExtractDojdevikPackCount.js";

function attrRow(name: string, value: string): string {
  return (
    `<td class="b-product-info__cell" data-qaid="attribute_name">${name}</td>` +
    `<td class="b-product-info__cell" data-qaid="attribute_value">${value}</td>`
  );
}

describe("legacyExtractDojdevikPackCount", () => {
  it("reads pure-digit пачці value", () => {
    expect(legacyExtractDojdevikPackCount(attrRow("Кількість в пачці.", "100"))).toBe(100);
  });

  it("skips наборі with N шт. and takes коробці digits (bug we migrate from)", () => {
    expect(
      legacyExtractDojdevikPackCount(
        attrRow("Кількість свічок в наборі", "6 шт.") + attrRow("Кількість у коробці", "100"),
      ),
    ).toBe(100);
  });

  it("reads description fallback", () => {
    expect(legacyExtractDojdevikPackCount("<h3>Кількість в упаковці 50 шт.</h3>")).toBe(50);
  });

  it("returns 1 when missing or invalid", () => {
    expect(legacyExtractDojdevikPackCount("")).toBe(1);
    expect(legacyExtractDojdevikPackCount(attrRow("Кількість в пачці.", "0"))).toBe(1);
    expect(legacyExtractDojdevikPackCount(attrRow("Кількість свічок в наборі", "6 шт."))).toBe(1);
  });
});
