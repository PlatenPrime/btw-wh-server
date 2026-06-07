import { describe, expect, it } from "vitest";
import { isFullMinusOneSliceStockResult, isFullMinusOneStockPrice, isInvalidSliceStockResult, } from "../isInvalidSliceStockResult.js";
describe("isFullMinusOneStockPrice", () => {
    it("returns true only when both stock and price are -1", () => {
        expect(isFullMinusOneStockPrice(-1, -1)).toBe(true);
        expect(isFullMinusOneStockPrice(-1, 10)).toBe(false);
        expect(isFullMinusOneStockPrice(0, -1)).toBe(false);
    });
});
describe("isFullMinusOneSliceStockResult", () => {
    it("returns true only for full -1/-1 object", () => {
        expect(isFullMinusOneSliceStockResult({ stock: -1, price: -1 })).toBe(true);
        expect(isFullMinusOneSliceStockResult({ stock: -1, price: 10 })).toBe(false);
        expect(isFullMinusOneSliceStockResult(null)).toBe(false);
    });
});
describe("isInvalidSliceStockResult", () => {
    it("returns false for valid stock and price", () => {
        expect(isInvalidSliceStockResult({ stock: 5, price: 100 })).toBe(false);
        expect(isInvalidSliceStockResult({ stock: 0, price: 0 })).toBe(false);
    });
    it("returns true for null or undefined", () => {
        expect(isInvalidSliceStockResult(null)).toBe(true);
        expect(isInvalidSliceStockResult(undefined)).toBe(true);
    });
    it("returns true when both stock and price are -1", () => {
        expect(isInvalidSliceStockResult({ stock: -1, price: -1 })).toBe(true);
    });
    it("returns true when only stock is -1", () => {
        expect(isInvalidSliceStockResult({ stock: -1, price: 100 })).toBe(true);
    });
    it("returns true when only price is -1", () => {
        expect(isInvalidSliceStockResult({ stock: 10, price: -1 })).toBe(true);
    });
});
