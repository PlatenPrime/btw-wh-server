import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { getSelectionSkusPieDataSchema } from "../getSelectionSkusPieDataSchema.js";

describe("getSelectionSkusPieDataSchema", () => {
  it("accepts valid body", () => {
    const parsed = getSelectionSkusPieDataSchema.safeParse({
      skuIds: [new Types.ObjectId().toString()],
      dateFrom: "2026-01-01",
      dateTo: "2026-01-05",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty skuIds", () => {
    expect(
      getSelectionSkusPieDataSchema.safeParse({
        skuIds: [],
        dateFrom: "2026-01-01",
        dateTo: "2026-01-05",
      }).success,
    ).toBe(false);
  });
});
