import { describe, expect, it } from "vitest";
import { isInvalidSliceStockPriceItem } from "../isInvalidSliceStockPriceItem.js";
import { invalidSliceEntryMongoCondition } from "../invalidSliceEntryMongoCondition.js";
describe("invalidSliceEntryMongoCondition", () => {
    it("stock field condition matches isInvalidSliceStockPriceItem for sample values", () => {
        const samples = [
            [-1, -1, true],
            [10, 100, false],
            [1, -5, true],
            [0, NaN, true],
            [5, undefined, true],
        ];
        for (const [stock, price, expected] of samples) {
            expect(isInvalidSliceStockPriceItem(stock, price)).toBe(expected);
        }
        expect(invalidSliceEntryMongoCondition("e", "stock")).toMatchObject({
            $or: expect.any(Array),
        });
        expect(invalidSliceEntryMongoCondition("entries", "quantity")).toMatchObject({
            $or: expect.any(Array),
        });
    });
});
