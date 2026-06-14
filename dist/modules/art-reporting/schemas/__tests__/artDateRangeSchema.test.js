import { describe, expect, it } from "vitest";
import { artDateRangeSchema } from "../artDateRangeSchema.js";
describe("artDateRangeSchema", () => {
    it("accepts valid date range", () => {
        const r = artDateRangeSchema.safeParse({
            dateFrom: "2026-03-01",
            dateTo: "2026-03-05",
        });
        expect(r.success).toBe(true);
    });
    it("rejects dateFrom after dateTo", () => {
        const r = artDateRangeSchema.safeParse({
            dateFrom: "2026-03-05",
            dateTo: "2026-03-01",
        });
        expect(r.success).toBe(false);
    });
});
