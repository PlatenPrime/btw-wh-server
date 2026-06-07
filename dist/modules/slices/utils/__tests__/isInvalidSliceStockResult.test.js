import { describe, expect, it } from "vitest";
import { isInvalidSliceStockResult } from "../isInvalidSliceStockResult.js";
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
