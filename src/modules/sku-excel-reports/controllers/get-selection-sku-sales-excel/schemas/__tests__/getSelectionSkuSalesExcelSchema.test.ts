import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { getSelectionSkuSalesExcelSchema } from "../getSelectionSkuSalesExcelSchema.js";

describe("getSelectionSkuSalesExcelSchema", () => {
  it("accepts valid selection sales params", () => {
    const parsed = getSelectionSkuSalesExcelSchema.safeParse({
      skuIds: [new Types.ObjectId().toString()],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-10",
      metrics: ["sales", "revenue"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid object id", () => {
    expect(
      getSelectionSkuSalesExcelSchema.safeParse({
        skuIds: ["not-an-id"],
        dateFrom: "2026-01-01",
        dateTo: "2026-01-10",
      }).success,
    ).toBe(false);
  });
});
