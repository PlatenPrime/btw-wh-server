import { describe, expect, it } from "vitest";
import { getSkuSliceByDateSchema } from "../getSkuSliceByDateSchema.js";
const VALID_SKU_ID = "507f1f77bcf86cd799439011";
describe("getSkuSliceByDateSchema", () => {
    it("parses valid skuId and date", () => {
        const result = getSkuSliceByDateSchema.safeParse({
            skuId: VALID_SKU_ID,
            date: "2026-06-01",
        });
        expect(result.success).toBe(true);
    });
    it("rejects invalid skuId", () => {
        const result = getSkuSliceByDateSchema.safeParse({
            skuId: "bad-id",
            date: "2026-06-01",
        });
        expect(result.success).toBe(false);
    });
});
