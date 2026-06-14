import { describe, expect, it } from "vitest";
import { getBtradeSliceRangeSchema } from "../getBtradeSliceRangeSchema.js";

describe("getBtradeSliceRangeSchema", () => {
  it("accepts artikul and date range", () => {
    const r = getBtradeSliceRangeSchema.safeParse({
      artikul: "ART-1",
      dateFrom: "2026-03-01",
      dateTo: "2026-03-02",
    });
    expect(r.success).toBe(true);
  });
});
