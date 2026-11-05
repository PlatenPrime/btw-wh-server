import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { skuSelectionResolveFieldsSchema } from "../skuSelectionResolveSchema.js";

describe("skuSelectionResolveFieldsSchema", () => {
  it("accepts skuIds mode", () => {
    expect(
      skuSelectionResolveFieldsSchema.safeParse({
        skuIds: [new Types.ObjectId().toString()],
      }).success,
    ).toBe(true);
  });

  it("accepts selectAll and trims empty filter strings to undefined", () => {
    const parsed = skuSelectionResolveFieldsSchema.safeParse({
      selectAll: true,
      search: "  ",
      konkName: " air ",
      prodName: "",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.search).toBeUndefined();
    expect(parsed.data.konkName).toBe("air");
    expect(parsed.data.prodName).toBeUndefined();
  });

  it("rejects both or neither", () => {
    expect(skuSelectionResolveFieldsSchema.safeParse({}).success).toBe(false);
    expect(
      skuSelectionResolveFieldsSchema.safeParse({
        selectAll: true,
        skuIds: [new Types.ObjectId().toString()],
      }).success,
    ).toBe(false);
  });
});
