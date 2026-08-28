import { describe, expect, it } from "vitest";
import { isSkuSliceDataKeyFilled } from "../isSkuSliceDataKeyFilled.js";

describe("isSkuSliceDataKeyFilled", () => {
  it("true for valid stock/price", () => {
    expect(isSkuSliceDataKeyFilled({ stock: 10, price: 2.5 })).toBe(true);
    expect(isSkuSliceDataKeyFilled({ stock: 0, price: 0 })).toBe(true);
  });

  it("false for -1 sentinel or partial invalid", () => {
    expect(isSkuSliceDataKeyFilled({ stock: -1, price: -1 })).toBe(false);
    expect(isSkuSliceDataKeyFilled({ stock: 1, price: -1 })).toBe(false);
  });

  it("false for non-object or missing numeric fields", () => {
    expect(isSkuSliceDataKeyFilled(null)).toBe(false);
    expect(isSkuSliceDataKeyFilled({ stock: 1 })).toBe(false);
    expect(isSkuSliceDataKeyFilled({ stock: "1", price: 2 })).toBe(false);
  });
});
