import { describe, expect, it } from "vitest";
import { toMoney } from "../toMoney.js";

describe("toMoney", () => {
  it("rounds to two decimal places", () => {
    expect(toMoney(1.705)).toBe(1.71);
    expect(toMoney(1.704)).toBe(1.7);
    expect(toMoney(10)).toBe(10);
  });

  it("handles division results used by pack→piece math", () => {
    expect(toMoney(119 / 70)).toBe(1.7);
    expect(toMoney(100 / 3)).toBe(33.33);
  });

  it("preserves zero and negatives", () => {
    expect(toMoney(0)).toBe(0);
    expect(toMoney(-1.239)).toBe(-1.24);
  });
});
