import { describe, expect, it } from "vitest";
import { excludeKonksSchema } from "../excludeKonksSchema.js";

describe("excludeKonksSchema", () => {
  it("returns undefined for empty or missing input", () => {
    expect(excludeKonksSchema.safeParse(undefined).success).toBe(true);
    expect(excludeKonksSchema.safeParse("").success).toBe(true);
    expect(excludeKonksSchema.safeParse(null).success).toBe(true);
  });

  it("parses CSV string into unique names array", () => {
    const result = excludeKonksSchema.safeParse("air, sharik,air");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["air", "sharik"]);
  });

  it("parses array query values", () => {
    const result = excludeKonksSchema.safeParse(["air", "sharik"]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["air", "sharik"]);
  });

  it("treats whitespace-only as missing", () => {
    const result = excludeKonksSchema.safeParse(["   "]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toBeUndefined();
  });
});

