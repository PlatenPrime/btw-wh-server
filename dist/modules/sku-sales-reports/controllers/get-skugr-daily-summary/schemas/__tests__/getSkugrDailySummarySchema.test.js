import { describe, expect, it } from "vitest";
import { getSkugrDailySummarySchema } from "../getSkugrDailySummarySchema.js";
const VALID_SKUGR_ID = "507f1f77bcf86cd799439011";
describe("getSkugrDailySummarySchema", () => {
    it("parses valid skugr summary range", () => {
        const result = getSkugrDailySummarySchema.safeParse({
            skugrId: VALID_SKUGR_ID,
            dateFrom: "2026-06-01",
            dateTo: "2026-06-03",
        });
        expect(result.success).toBe(true);
    });
    it("rejects invalid skugrId", () => {
        const result = getSkugrDailySummarySchema.safeParse({
            skugrId: "nope",
            dateFrom: "2026-06-01",
            dateTo: "2026-06-03",
        });
        expect(result.success).toBe(false);
    });
});
