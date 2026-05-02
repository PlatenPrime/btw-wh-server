import { describe, expect, it } from "vitest";
import { parseStrippedDecimal } from "../parseStrippedDecimal.js";
describe("parseStrippedDecimal", () => {
    it("strips currency text", () => {
        expect(parseStrippedDecimal("12,50 грн.")).toBe(12.5);
    });
    it("returns null for empty or invalid", () => {
        expect(parseStrippedDecimal("")).toBeNull();
        expect(parseStrippedDecimal(null)).toBeNull();
        expect(parseStrippedDecimal("abc")).toBeNull();
    });
});
