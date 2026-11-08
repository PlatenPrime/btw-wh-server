import { describe, expect, it } from "vitest";
import { discoverStockBandSchema } from "../discoverStockBandSchema.js";

describe("discoverStockBandSchema", () => {
  it("accepts valid payload", () => {
    const parsed = discoverStockBandSchema.safeParse({
      bandId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-08",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid bandId", () => {
    const parsed = discoverStockBandSchema.safeParse({
      bandId: "bad",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-08",
    });
    expect(parsed.success).toBe(false);
  });
});
