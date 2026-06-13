import { describe, expect, it } from "vitest";
import { getSkugrSalesExcelSchema } from "../getSkugrSalesExcelSchema.js";

const VALID_SKUGR_ID = "507f1f77bcf86cd799439011";

describe("getSkugrSalesExcelSchema", () => {
  it("parses valid skugr sales excel params", () => {
    const result = getSkugrSalesExcelSchema.safeParse({
      skugrId: VALID_SKUGR_ID,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(result.success).toBe(true);
  });
});
