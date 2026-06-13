import { describe, expect, it } from "vitest";
import { dateStringSchema } from "../dateSchema.js";
describe("dateStringSchema", () => {
    it("parses valid YYYY-MM-DD into UTC midnight Date", () => {
        const result = dateStringSchema.safeParse("2026-06-01");
        expect(result.success).toBe(true);
        if (!result.success)
            return;
        expect(result.data.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    });
    it("rejects invalid date format", () => {
        const result = dateStringSchema.safeParse("01-06-2026");
        expect(result.success).toBe(false);
    });
});
