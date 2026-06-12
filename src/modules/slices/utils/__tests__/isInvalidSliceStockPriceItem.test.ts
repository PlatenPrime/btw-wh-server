import { describe, expect, it } from "vitest";
import { isInvalidSliceStockPriceItem } from "../isInvalidSliceStockPriceItem.js";

describe("isInvalidSliceStockPriceItem", () => {
  it("returns true for full -1/-1", () => {
    expect(isInvalidSliceStockPriceItem(-1, -1)).toBe(true);
  });

  it("returns false for finite non-negative price", () => {
    expect(isInvalidSliceStockPriceItem(0, 0)).toBe(false);
    expect(isInvalidSliceStockPriceItem(-1, 10)).toBe(false);
    expect(isInvalidSliceStockPriceItem(5, 99.5)).toBe(false);
  });

  it("returns true when price is missing or non-numeric", () => {
    expect(isInvalidSliceStockPriceItem(1, undefined)).toBe(true);
    expect(isInvalidSliceStockPriceItem(1, "10")).toBe(true);
    expect(isInvalidSliceStockPriceItem(1, null)).toBe(true);
  });

  it("returns true for NaN or non-finite price", () => {
    expect(isInvalidSliceStockPriceItem(0, NaN)).toBe(true);
    expect(isInvalidSliceStockPriceItem(0, Infinity)).toBe(true);
  });

  it("returns true for negative price", () => {
    expect(isInvalidSliceStockPriceItem(10, -5)).toBe(true);
    expect(isInvalidSliceStockPriceItem(0, -1)).toBe(true);
  });
});
