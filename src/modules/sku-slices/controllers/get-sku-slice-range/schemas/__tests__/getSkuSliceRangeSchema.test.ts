import { describe, expect, it } from "vitest";
import { getSkuSliceRangeSchema } from "../getSkuSliceRangeSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("getSkuSliceRangeSchema", () => {
  it("parses valid range", () => {
    const result = getSkuSliceRangeSchema.safeParse({
      skuId: VALID_SKU_ID,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects inverted range", () => {
    const result = getSkuSliceRangeSchema.safeParse({
      skuId: VALID_SKU_ID,
      dateFrom: "2026-06-10",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });
});
