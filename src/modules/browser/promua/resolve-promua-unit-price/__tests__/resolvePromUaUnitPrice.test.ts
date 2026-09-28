import { describe, expect, it } from "vitest";
import { resolvePromUaUnitPrice } from "../resolvePromUaUnitPrice.js";

describe("resolvePromUaUnitPrice", () => {
  it("prefers HTML price over GraphQL", () => {
    expect(resolvePromUaUnitPrice(1.46, 9.99)).toBe(1.46);
    expect(resolvePromUaUnitPrice(0, 9.99)).toBe(0);
  });

  it("treats null and undefined HTML as missing", () => {
    expect(resolvePromUaUnitPrice(null, 1.5)).toBe(1.5);
    expect(resolvePromUaUnitPrice(undefined, 1.5)).toBe(1.5);
  });

  it("accepts finite GraphQL price >= 0", () => {
    expect(resolvePromUaUnitPrice(null, 0)).toBe(0);
    expect(resolvePromUaUnitPrice(undefined, 12.34)).toBe(12.34);
  });

  it("rejects invalid GraphQL prices", () => {
    expect(resolvePromUaUnitPrice(null, null)).toBeUndefined();
    expect(resolvePromUaUnitPrice(null, undefined)).toBeUndefined();
    expect(resolvePromUaUnitPrice(null, Number.NaN)).toBeUndefined();
    expect(resolvePromUaUnitPrice(null, -1)).toBeUndefined();
    expect(resolvePromUaUnitPrice(null, Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});
