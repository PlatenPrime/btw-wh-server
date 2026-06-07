import { describe, expect, it } from "vitest";
import { formatPosesStocksForExcelUtil } from "../formatPosesStocksForExcelUtil.js";

describe("formatPosesStocksForExcelUtil", () => {
  it("aggregates by artikul when selectedSklad is set", () => {
    const result = formatPosesStocksForExcelUtil(
      [
        { artikul: "ART-001", nameukr: "Товар", quant: 5, sklad: "merezhi" },
        { artikul: "ART-001", nameukr: "", quant: 3, sklad: "merezhi" },
        { artikul: "ART-002", quant: 0, sklad: "merezhi" },
      ],
      { selectedSklad: "merezhi" }
    );

    expect(result).toEqual([
      {
        Артикул: "ART-001",
        "Название (укр)": "Товар",
        Склад: "Мережі",
        Количество: 8,
      },
    ]);
  });

  it("separates rows by sklad when selectedSklad is not set", () => {
    const result = formatPosesStocksForExcelUtil([
      { artikul: "ART-001", nameukr: "Товар", quant: 4, sklad: "merezhi" },
      { artikul: "ART-001", quant: 6, sklad: "pogrebi" },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      Артикул: "ART-001",
      Склад: "Мережі",
      Количество: 4,
    });
    expect(result[1]).toMatchObject({
      Артикул: "ART-001",
      Склад: "Погреби",
      Количество: 6,
    });
  });

  it("uses default sklad label for empty sklad", () => {
    const result = formatPosesStocksForExcelUtil([
      { artikul: "ART-001", quant: 2, sklad: null },
    ]);

    expect(result[0].Склад).toBe("Не указан");
  });

  it("sorts by artikul then sklad label", () => {
    const result = formatPosesStocksForExcelUtil([
      { artikul: "B-002", quant: 1, sklad: "pogrebi" },
      { artikul: "A-001", quant: 1, sklad: "merezhi" },
      { artikul: "A-001", quant: 2, sklad: "pogrebi" },
    ]);

    expect(result.map((r) => `${r.Артикул}:${r.Склад}`)).toEqual([
      "A-001:Мережі",
      "A-001:Погреби",
      "B-002:Погреби",
    ]);
  });
});
