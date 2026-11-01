import { describe, expect, it } from "vitest";
import { computeSharePercent } from "../computeSharePercent.js";

describe("computeSharePercent", () => {
  it("computes percent with 2 decimals", () => {
    expect(computeSharePercent(1, 3)).toBe(33.33);
    expect(computeSharePercent(2, 3)).toBe(66.67);
    expect(computeSharePercent(50, 100)).toBe(50);
  });

  it("returns 0 when total is 0 or non-finite", () => {
    expect(computeSharePercent(5, 0)).toBe(0);
    expect(computeSharePercent(5, Number.NaN)).toBe(0);
    expect(computeSharePercent(Number.NaN, 10)).toBe(0);
  });
});
