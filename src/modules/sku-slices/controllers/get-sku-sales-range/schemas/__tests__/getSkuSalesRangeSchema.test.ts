import { describe, expect, it } from "vitest";
import { getSkuSalesRangeSchema } from "../getSkuSalesRangeSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("getSkuSalesRangeSchema", () => {
  it("parses valid sales range", () => {
    const result = getSkuSalesRangeSchema.safeParse({
      skuId: VALID_SKU_ID,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid skuId", () => {
    const result = getSkuSalesRangeSchema.safeParse({
      skuId: "x",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(result.success).toBe(false);
  });
});
