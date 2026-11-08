import { describe, expect, it } from "vitest";
import { bandBoundsFieldsSchema } from "../bandBoundsSchema.js";

describe("bandBoundsFieldsSchema", () => {
  it("accepts valid bounds", () => {
    const parsed = bandBoundsFieldsSchema.safeParse({
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects stockMin > stockMax", () => {
    const parsed = bandBoundsFieldsSchema.safeParse({
      stockMin: 10500,
      stockMax: 9500,
      normalMax: 500,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects normalMax >= stockMin", () => {
    const parsed = bandBoundsFieldsSchema.safeParse({
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 9500,
    });
    expect(parsed.success).toBe(false);
  });
});
