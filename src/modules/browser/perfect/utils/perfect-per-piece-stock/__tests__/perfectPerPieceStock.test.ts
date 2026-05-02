import { describe, expect, it } from "vitest";
import { toStockAndPrice } from "../perfectPerPieceStock.js";

describe("toStockAndPrice", () => {
  it("multiplies stock by pack from title", () => {
    expect(
      toStockAndPrice(9, 45, "Кулька 10 шт. в уп.", "<html></html>")
    ).toEqual({
      stock: 90,
      price: 4.5,
      title: "Кулька 10 шт. в уп.",
    });
  });

  it("uses HTML pack when title has no шт", () => {
    const html = "<p>Штук в упаковці: 100</p>";
    expect(
      toStockAndPrice(1, 275, "Кулька Gemar пастель", html)
    ).toEqual({
      stock: 100,
      price: 2.75,
      title: "Кулька Gemar пастель",
    });
  });

  it("returns packs as stock when no pack info", () => {
    expect(toStockAndPrice(9, 45, "Без фасовки", "")).toEqual({
      stock: 9,
      price: 45,
      title: "Без фасовки",
    });
  });

  it("omits title when empty", () => {
    expect(toStockAndPrice(1, 10, "", "")).toEqual({ stock: 1, price: 10 });
  });
});
