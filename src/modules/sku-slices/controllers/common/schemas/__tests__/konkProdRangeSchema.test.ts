import { describe, expect, it } from "vitest";
import { konkProdRangeSchema } from "../konkProdRangeSchema.js";

const VALID_ID = "507f1f77bcf86cd799439011";

describe("konkProdRangeSchema", () => {
  it("parses valid konk/prod date range", () => {
    const result = konkProdRangeSchema.safeParse({
      konk: "air",
      prod: "Acme",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-03",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.konk).toBe("air");
    expect(result.data.prod).toBe("Acme");
  });

  it("accepts optional skugrIds", () => {
    const result = konkProdRangeSchema.safeParse({
      konk: "air",
      prod: "all",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-01",
      skugrIds: VALID_ID,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.skugrIds).toEqual([VALID_ID]);
  });

  it("rejects empty konk", () => {
    const result = konkProdRangeSchema.safeParse({
      konk: "  ",
      prod: "p",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects dateFrom after dateTo", () => {
    const result = konkProdRangeSchema.safeParse({
      konk: "k",
      prod: "p",
      dateFrom: "2026-06-10",
      dateTo: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });
});
