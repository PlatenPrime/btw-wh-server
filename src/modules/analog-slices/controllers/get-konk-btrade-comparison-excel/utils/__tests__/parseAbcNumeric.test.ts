import { describe, expect, it } from "vitest";
import { parseAbcNumeric } from "../getKonkBtradeComparisonRangeUtil.js";

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
