import { describe, expect, it } from "vitest";
import { shouldRefetchSkuSliceItem } from "../shouldRefetchSkuSliceItem.js";
describe("shouldRefetchSkuSliceItem", () => {
    it("true for full -1/-1", () => {
        expect(shouldRefetchSkuSliceItem({ stock: -1, price: -1 })).toBe(true);
    });
    it("false for finite non-negative price", () => {
        expect(shouldRefetchSkuSliceItem({ stock: 0, price: 0 })).toBe(false);
        expect(shouldRefetchSkuSliceItem({ stock: -1, price: 10 })).toBe(false);
        expect(shouldRefetchSkuSliceItem({ stock: 5, price: 99.5 })).toBe(false);
    });
    it("true when price missing or non-numeric", () => {
        expect(shouldRefetchSkuSliceItem({ stock: 1 })).toBe(true);
        expect(shouldRefetchSkuSliceItem({ stock: 1, price: "10" })).toBe(true);
        expect(shouldRefetchSkuSliceItem({ stock: 1, price: null })).toBe(true);
    });
    it("true for NaN or non-finite", () => {
        expect(shouldRefetchSkuSliceItem({ stock: 0, price: NaN })).toBe(true);
        expect(shouldRefetchSkuSliceItem({ stock: 0, price: Infinity })).toBe(true);
    });
    it("true for negative price", () => {
        expect(shouldRefetchSkuSliceItem({ stock: 10, price: -5 })).toBe(true);
        expect(shouldRefetchSkuSliceItem({ stock: 0, price: -1 })).toBe(true);
    });
    it("false for null or non-object", () => {
        expect(shouldRefetchSkuSliceItem(null)).toBe(false);
        expect(shouldRefetchSkuSliceItem(undefined)).toBe(false);
        expect(shouldRefetchSkuSliceItem("x")).toBe(false);
    });
});
