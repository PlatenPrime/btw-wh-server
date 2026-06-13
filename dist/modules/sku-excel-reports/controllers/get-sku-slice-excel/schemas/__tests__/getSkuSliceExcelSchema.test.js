import { describe, expect, it } from "vitest";
import { getSkuSliceExcelSchema } from "../getSkuSliceExcelSchema.js";
const VALID_SKU_ID = "507f1f77bcf86cd799439011";
describe("getSkuSliceExcelSchema", () => {
    it("parses valid excel range params", () => {
        const result = getSkuSliceExcelSchema.safeParse({
            skuId: VALID_SKU_ID,
            dateFrom: "2026-06-01",
            dateTo: "2026-06-05",
        });
        expect(result.success).toBe(true);
    });
    it("rejects inverted date range", () => {
        const result = getSkuSliceExcelSchema.safeParse({
            skuId: VALID_SKU_ID,
            dateFrom: "2026-06-10",
            dateTo: "2026-06-01",
        });
        expect(result.success).toBe(false);
    });
});
