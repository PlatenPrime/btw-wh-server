import { describe, expect, it } from "vitest";
import { getSkuSalesExcelSchema } from "../getSkuSalesExcelSchema.js";

const VALID_SKU_ID = "507f1f77bcf86cd799439011";

describe("getSkuSalesExcelSchema", () => {
  it("parses valid sales excel params", () => {
    const result = getSkuSalesExcelSchema.safeParse({
      skuId: VALID_SKU_ID,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(result.success).toBe(true);
  });
});
