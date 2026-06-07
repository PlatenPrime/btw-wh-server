import { describe, expect, it } from "vitest";
import { getSkugrSliceExcelSchema } from "../getSkugrSliceExcelSchema.js";

const VALID_SKUGR_ID = "507f1f77bcf86cd799439011";

describe("getSkugrSliceExcelSchema", () => {
  it("parses valid skugr slice excel params", () => {
    const result = getSkugrSliceExcelSchema.safeParse({
      skugrId: VALID_SKUGR_ID,
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(result.success).toBe(true);
  });

  it("rejects inverted date range", () => {
    const result = getSkugrSliceExcelSchema.safeParse({
      skugrId: VALID_SKUGR_ID,
      dateFrom: "2026-06-10",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });
});
