import { describe, expect, it } from "vitest";
import { toSliceDate } from "../sliceDate.js";
describe("toSliceDate", () => {
    it("maps instant to UTC midnight of the same calendar day in Europe/Kiev", () => {
        const d = new Date("2025-03-01T15:30:00.000Z");
        expect(toSliceDate(d).toISOString()).toBe("2025-03-01T00:00:00.000Z");
    });
    it("at Kyiv midnight the key is the new Kyiv day (not previous UTC day)", () => {
        const kyivMidnightUtc = new Date("2025-01-15T22:00:00.000Z");
        expect(toSliceDate(kyivMidnightUtc).toISOString()).toBe("2025-01-16T00:00:00.000Z");
    });
});
