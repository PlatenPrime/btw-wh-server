import { describe, expect, it } from "vitest";
import {
  parseCartResponse,
  parsePackPrice,
  resolvePerfectCartDeleteIds,
} from "../perfectCartResponse.js";

describe("parseCartResponse", () => {
  it("parses valid cart JSON", () => {
    const raw = JSON.stringify({
      success: true,
      cart: { products: [{ stock_quantity: 1 }] },
    });
    expect(parseCartResponse(raw)?.cart?.products?.[0]?.stock_quantity).toBe(1);
  });

  it("returns null for invalid json", () => {
    expect(parseCartResponse("<html>")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCartResponse("   ")).toBeNull();
  });

  it("returns null for array root", () => {
    expect(parseCartResponse("[1]")).toBeNull();
  });
});

describe("parsePackPrice", () => {
  it("uses price_without_reduction first", () => {
    expect(parsePackPrice({ price_without_reduction: 10, price: 99 })).toBe(10);
  });

  it("falls back to embedded_attributes", () => {
    expect(
      parsePackPrice({
        embedded_attributes: { price_without_reduction: "12,5" },
      })
    ).toBe(12.5);
  });

  it("uses embedded price then product price", () => {
    expect(
      parsePackPrice({
        embedded_attributes: { price: "8" },
      })
    ).toBe(8);
    expect(parsePackPrice({ price: 7 })).toBe(7);
  });
});

describe("resolvePerfectCartDeleteIds", () => {
  it("uses cart product ids when present", () => {
    expect(
      resolvePerfectCartDeleteIds(
        { id_product: 12115, id_product_attribute: 3651, id_customization: 3 },
        { idProduct: "1", idProductAttribute: "2", idCustomization: "0" }
      )
    ).toEqual({
      idProduct: "12115",
      idProductAttribute: "3651",
      idCustomization: "3",
    });
  });

  it("falls back when product is missing", () => {
    const fallback = {
      idProduct: "1",
      idProductAttribute: "2",
      idCustomization: "0",
    };
    expect(resolvePerfectCartDeleteIds(undefined, fallback)).toEqual(fallback);
  });

  it("falls back when cart ids are empty", () => {
    const fallback = {
      idProduct: "1",
      idProductAttribute: "2",
      idCustomization: "0",
    };
    expect(
      resolvePerfectCartDeleteIds(
        { id_product: "  ", id_product_attribute: "", id_customization: "" },
        fallback
      )
    ).toEqual(fallback);
  });
});
