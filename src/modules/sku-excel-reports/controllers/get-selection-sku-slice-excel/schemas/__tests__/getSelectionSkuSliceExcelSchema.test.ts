import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { getSelectionSkuSliceExcelSchema } from "../getSelectionSkuSliceExcelSchema.js";

describe("getSelectionSkuSliceExcelSchema", () => {
  it("accepts valid selection stock params", () => {
    const id = new Types.ObjectId().toString();
    const parsed = getSelectionSkuSliceExcelSchema.safeParse({
      skuIds: [id],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-10",
      metrics: "stock",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty skuIds and inverted dates", () => {
    expect(
      getSelectionSkuSliceExcelSchema.safeParse({
        skuIds: [],
        dateFrom: "2026-01-01",
        dateTo: "2026-01-10",
      }).success,
    ).toBe(false);

    expect(
      getSelectionSkuSliceExcelSchema.safeParse({
        skuIds: [new Types.ObjectId().toString()],
        dateFrom: "2026-01-10",
        dateTo: "2026-01-01",
      }).success,
    ).toBe(false);
  });

  it("rejects more than 100 skuIds", () => {
    const skuIds = Array.from({ length: 101 }, () => new Types.ObjectId().toString());
    expect(
      getSelectionSkuSliceExcelSchema.safeParse({
        skuIds,
        dateFrom: "2026-01-01",
        dateTo: "2026-01-02",
      }).success,
    ).toBe(false);
  });
});
