import { describe, expect, it } from "vitest";
import { extractPackCount } from "../extractPackCount.js";

describe("extractPackCount", () => {
  it("reads from parentheses", () => {
    expect(extractPackCount("x (10 шт)")).toBe(10);
  });

  it("reads N шт without parens", () => {
    expect(extractPackCount("50 шт")).toBe(50);
  });
});
