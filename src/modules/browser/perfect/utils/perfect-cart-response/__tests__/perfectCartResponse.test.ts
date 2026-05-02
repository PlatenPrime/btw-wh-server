import { describe, expect, it } from "vitest";
import { parseCartResponse, parsePackPrice } from "../perfectCartResponse.js";

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
