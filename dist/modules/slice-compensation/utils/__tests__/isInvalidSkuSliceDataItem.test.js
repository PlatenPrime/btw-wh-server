import { describe, expect, it } from "vitest";
import { isInvalidSkuSliceDataItem } from "../isInvalidSkuSliceDataItem.js";
describe("isInvalidSkuSliceDataItem", () => {
    it("returns true for full -1/-1", () => {
        expect(isInvalidSkuSliceDataItem(-1, -1)).toBe(true);
    });
    it("returns false for finite non-negative price", () => {
        expect(isInvalidSkuSliceDataItem(0, 0)).toBe(false);
        expect(isInvalidSkuSliceDataItem(-1, 10)).toBe(false);
        expect(isInvalidSkuSliceDataItem(5, 99.5)).toBe(false);
    });
    it("returns true when price is missing or non-numeric", () => {
        expect(isInvalidSkuSliceDataItem(1, undefined)).toBe(true);
        expect(isInvalidSkuSliceDataItem(1, "10")).toBe(true);
        expect(isInvalidSkuSliceDataItem(1, null)).toBe(true);
    });
    it("returns true for NaN or non-finite price", () => {
        expect(isInvalidSkuSliceDataItem(0, NaN)).toBe(true);
        expect(isInvalidSkuSliceDataItem(0, Infinity)).toBe(true);
    });
    it("returns true for negative price", () => {
        expect(isInvalidSkuSliceDataItem(10, -5)).toBe(true);
        expect(isInvalidSkuSliceDataItem(0, -1)).toBe(true);
    });
});
