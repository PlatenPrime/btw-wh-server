import { describe, expect, it } from "vitest";
import { isFullMinusOneSliceItem } from "../isFullMinusOneSliceItem.js";

describe("isFullMinusOneSliceItem", () => {
  it("returns true only when both stock and price are -1", () => {
    expect(isFullMinusOneSliceItem({ stock: -1, price: -1 })).toBe(true);
  });

  it("returns false when stock is not -1", () => {
    expect(isFullMinusOneSliceItem({ stock: 0, price: -1 })).toBe(false);
  });

  it("returns false when price is not -1", () => {
    expect(isFullMinusOneSliceItem({ stock: -1, price: 10 })).toBe(false);
  });

  it("returns false for null, non-object, or missing fields", () => {
    expect(isFullMinusOneSliceItem(null)).toBe(false);
    expect(isFullMinusOneSliceItem(undefined)).toBe(false);
    expect(isFullMinusOneSliceItem("x")).toBe(false);
    expect(isFullMinusOneSliceItem({ stock: -1 })).toBe(false);
    expect(isFullMinusOneSliceItem({ price: -1 })).toBe(false);
  });
});
