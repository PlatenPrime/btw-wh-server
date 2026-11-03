import { describe, expect, it } from "vitest";
import { skuSkugrSkusShareParamsSchema } from "../skuSkugrSkusShareParamsSchema.js";

const SKUGR_ID = "507f1f77bcf86cd799439011";

describe("skuSkugrSkusShareParamsSchema", () => {
  it("parses a range without sortBy", () => {
    const parsed = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "2026-10-26",
      dateTo: "2026-11-03",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.sortBy).toBeUndefined();
    expect(parsed.data.dateFrom).toBe("2026-10-26");
  });

  it("parses sortBy sales and revenue", () => {
    for (const sortBy of ["sales", "revenue"] as const) {
      const parsed = skuSkugrSkusShareParamsSchema.safeParse({
        skugrId: SKUGR_ID,
        dateFrom: "2026-10-26",
        dateTo: "2026-10-26",
        sortBy,
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("accepts a leap day", () => {
    const parsed = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "2024-02-29",
      dateTo: "2024-02-29",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid skugr id", () => {
    const parsed = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: "nope",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-03",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-calendar date and a bad format", () => {
    const rolled = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "2026-02-31",
      dateTo: "2026-03-01",
    });
    const format = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "26-10-2026",
      dateTo: "2026-11-03",
    });
    expect(rolled.success).toBe(false);
    expect(format.success).toBe(false);
  });

  it("rejects dateFrom after dateTo", () => {
    const parsed = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "2026-11-03",
      dateTo: "2026-10-26",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown sortBy and extra keys", () => {
    const sortBy = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "2026-10-26",
      dateTo: "2026-11-03",
      sortBy: "price",
    });
    const extra = skuSkugrSkusShareParamsSchema.safeParse({
      skugrId: SKUGR_ID,
      dateFrom: "2026-10-26",
      dateTo: "2026-11-03",
      metrics: ["sales"],
    });
    expect(sortBy.success).toBe(false);
    expect(extra.success).toBe(false);
  });
});
