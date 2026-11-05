import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { getSelectionSkuSalesExcelSchema } from "../getSelectionSkuSalesExcelSchema.js";

describe("getSelectionSkuSalesExcelSchema", () => {
  it("accepts skuIds mode and defaults includeImages to false", () => {
    const parsed = getSelectionSkuSalesExcelSchema.safeParse({
      skuIds: [new Types.ObjectId().toString()],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-05",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.includeImages).toBeUndefined();
    }
  });

  it("accepts selectAll mode", () => {
    expect(
      getSelectionSkuSalesExcelSchema.safeParse({
        selectAll: true,
        konkName: "air",
        dateFrom: "2026-01-01",
        dateTo: "2026-01-05",
        metrics: ["sales"],
      }).success,
    ).toBe(true);
  });

  it("rejects selectAll together with skuIds", () => {
    expect(
      getSelectionSkuSalesExcelSchema.safeParse({
        selectAll: true,
        skuIds: [new Types.ObjectId().toString()],
        dateFrom: "2026-01-01",
        dateTo: "2026-01-05",
      }).success,
    ).toBe(false);
  });
});
