import { describe, expect, it } from "vitest";
import { getBtradeSliceQuerySchema } from "../getBtradeSliceQuerySchema.js";
describe("getBtradeSliceQuerySchema", () => {
    it("parses required date with defaults", () => {
        const result = getBtradeSliceQuerySchema.safeParse({
            date: "2026-06-01",
        });
        expect(result.success).toBe(true);
        if (!result.success)
            return;
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.isInvalid).toBeUndefined();
    });
    it("transforms isInvalid and pagination strings", () => {
        const result = getBtradeSliceQuerySchema.safeParse({
            date: "2026-06-01",
            isInvalid: "true",
            page: "2",
            limit: "25",
        });
        expect(result.success).toBe(true);
        if (!result.success)
            return;
        expect(result.data.isInvalid).toBe(true);
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(25);
    });
    it("rejects limit above 100", () => {
        const result = getBtradeSliceQuerySchema.safeParse({
            date: "2026-06-01",
            limit: "101",
        });
        expect(result.success).toBe(false);
    });
});
