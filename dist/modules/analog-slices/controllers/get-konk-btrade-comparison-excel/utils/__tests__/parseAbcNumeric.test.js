import { describe, expect, it } from "vitest";
import { getAbcLetterOrder, parseAbcNumeric, } from "../getKonkBtradeComparisonRangeUtil.js";
describe("getAbcLetterOrder", () => {
    it('returns 0 for A (e.g. "50A")', () => {
        expect(getAbcLetterOrder("50A")).toBe(0);
        expect(getAbcLetterOrder("12A")).toBe(0);
    });
    it('returns 1 for B (e.g. "101B")', () => {
        expect(getAbcLetterOrder("101B")).toBe(1);
        expect(getAbcLetterOrder("2B")).toBe(1);
    });
    it("returns 2 for C, 3 for D", () => {
        expect(getAbcLetterOrder("34C")).toBe(2);
        expect(getAbcLetterOrder("4D")).toBe(3);
    });
    it("returns 4 (last) for empty, null, or non-A/B/C/D", () => {
        expect(getAbcLetterOrder("")).toBe(4);
        expect(getAbcLetterOrder(null)).toBe(4);
        expect(getAbcLetterOrder("X")).toBe(4);
        expect(getAbcLetterOrder("99Z")).toBe(4);
    });
});
describe("parseAbcNumeric", () => {
    it('extracts number from "101B"', () => {
        expect(parseAbcNumeric("101B")).toBe(101);
    });
    it('extracts number from "50A"', () => {
        expect(parseAbcNumeric("50A")).toBe(50);
    });
    it('returns 0 for empty string', () => {
        expect(parseAbcNumeric("")).toBe(0);
    });
    it("returns 0 for null", () => {
        expect(parseAbcNumeric(null)).toBe(0);
    });
    it('returns 0 when only letter (no leading digits)', () => {
        expect(parseAbcNumeric("B")).toBe(0);
        expect(parseAbcNumeric("A")).toBe(0);
    });
    it('extracts number when only digits', () => {
        expect(parseAbcNumeric("999")).toBe(999);
    });
    it('ignores digits after non-digit (takes leading segment only)', () => {
        expect(parseAbcNumeric("101B50")).toBe(101);
    });
    it('handles whitespace by trimming', () => {
        expect(parseAbcNumeric("  202C  ")).toBe(202);
    });
});
