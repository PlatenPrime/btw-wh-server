import { describe, expect, it } from "vitest";
import { isPositiveNumber } from "../isPositiveNumber.js";

describe("isPositiveNumber", () => {
  it("возвращает true для положительных чисел", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(10)).toBe(true);
    expect(isPositiveNumber(100.5)).toBe(true);
    expect(isPositiveNumber(0.1)).toBe(true);
    expect(isPositiveNumber(Number.MAX_VALUE)).toBe(true);
  });

  it("возвращает false для отрицательных чисел", () => {
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber(-10)).toBe(false);
    expect(isPositiveNumber(-100.5)).toBe(false);
    expect(isPositiveNumber(-0.1)).toBe(false);
  });

  it("возвращает false для нуля", () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-0)).toBe(false);
  });

  it("возвращает false для NaN", () => {
    expect(isPositiveNumber(NaN)).toBe(false);
  });

  it("возвращает false для не-чисел", () => {
    expect(isPositiveNumber("123" as any)).toBe(false);
    expect(isPositiveNumber("" as any)).toBe(false);
    expect(isPositiveNumber(null as any)).toBe(false);
    expect(isPositiveNumber(undefined as any)).toBe(false);
    expect(isPositiveNumber({} as any)).toBe(false);
    expect(isPositiveNumber([] as any)).toBe(false);
    expect(isPositiveNumber(true as any)).toBe(false);
    expect(isPositiveNumber(false as any)).toBe(false);
  });

  it("является type guard", () => {
    const value: unknown = 5;

    if (isPositiveNumber(value)) {
      // TypeScript должен понимать что value - это number
      expect(typeof value).toBe("number");
      expect(value > 0).toBe(true);
    }
  });
});

