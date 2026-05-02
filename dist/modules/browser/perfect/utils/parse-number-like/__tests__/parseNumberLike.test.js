import { describe, expect, it } from "vitest";
import { parseNumberLike } from "../parseNumberLike.js";
describe("parseNumberLike", () => {
    it("parses finite non-negative numbers", () => {
        expect(parseNumberLike(42)).toBe(42);
        expect(parseNumberLike(0)).toBe(0);
    });
    it("rejects negative or non-finite numbers", () => {
        expect(parseNumberLike(-1)).toBeNull();
        expect(parseNumberLike(NaN)).toBeNull();
        expect(parseNumberLike(Infinity)).toBeNull();
    });
    it("parses Ukrainian price strings", () => {
        expect(parseNumberLike("45,00 грн.")).toBe(45);
        expect(parseNumberLike("99,90 грн.")).toBe(99.9);
    });
    it("handles NBSP and spaces", () => {
        expect(parseNumberLike("1\u00a0234,56")).toBe(1234.56);
    });
    it("returns null for empty or non-matching strings", () => {
        expect(parseNumberLike("")).toBeNull();
        expect(parseNumberLike("abc")).toBeNull();
    });
    it("returns null for non-string non-number", () => {
        expect(parseNumberLike(null)).toBeNull();
        expect(parseNumberLike({})).toBeNull();
    });
});
