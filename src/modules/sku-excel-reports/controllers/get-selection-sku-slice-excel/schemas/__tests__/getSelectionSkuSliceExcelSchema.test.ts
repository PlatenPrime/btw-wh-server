import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { getSelectionSkuSliceExcelSchema } from "../getSelectionSkuSliceExcelSchema.js";

describe("getSelectionSkuSliceExcelSchema", () => {
  it("accepts valid selection stock params with skuIds", () => {
    const id = new Types.ObjectId().toString();
    const parsed = getSelectionSkuSliceExcelSchema.safeParse({
      skuIds: [id],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-10",
      metrics: "stock",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.includeImages).toBeUndefined();
    }
  });

  it("accepts 101 skuIds without upper bound", () => {
    const skuIds = Array.from({ length: 101 }, () => new Types.ObjectId().toString());
    expect(
      getSelectionSkuSliceExcelSchema.safeParse({
        skuIds,
        dateFrom: "2026-01-01",
        dateTo: "2026-01-02",
      }).success,
    ).toBe(true);
  });

  it("accepts selectAll with catalog filters", () => {
    const parsed = getSelectionSkuSliceExcelSchema.safeParse({
      selectAll: true,
      search: "Happy",
      konkName: "ivvo",
      prodName: "APT-SHOW",
      dateFrom: "2026-01-01",
      dateTo: "2026-01-02",
      includeImages: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.includeImages).toBe(true);
      expect(parsed.data.search).toBe("Happy");
    }
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

  it("rejects XOR violations for selectAll and skuIds", () => {
    expect(
      getSelectionSkuSliceExcelSchema.safeParse({
        selectAll: true,
        skuIds: [new Types.ObjectId().toString()],
        dateFrom: "2026-01-01",
        dateTo: "2026-01-02",
      }).success,
    ).toBe(false);

    expect(
      getSelectionSkuSliceExcelSchema.safeParse({
        dateFrom: "2026-01-01",
        dateTo: "2026-01-02",
      }).success,
    ).toBe(false);
  });
});
