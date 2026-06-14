import { describe, expect, it } from "vitest";
import { getArtSalesRangeSchema } from "../getArtSalesRangeSchema.js";

describe("getArtSalesRangeSchema", () => {
  it("accepts artikul and date range", () => {
    const r = getArtSalesRangeSchema.safeParse({
      artikul: "ART-1",
      dateFrom: "2026-03-01",
      dateTo: "2026-03-02",
    });
    expect(r.success).toBe(true);
  });
});
