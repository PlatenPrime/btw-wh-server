import { describe, expect, it } from "vitest";
import { getKonkSkuSliceExcelSchema } from "../getKonkSkuSliceExcelSchema.js";

describe("getKonkSkuSliceExcelSchema", () => {
  it("parses konkProdRange params without metrics", () => {
    const result = getKonkSkuSliceExcelSchema.safeParse({
      konk: "air",
      prod: "gemar",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.metrics).toBeUndefined();
  });

  it("accepts optional metrics", () => {
    const result = getKonkSkuSliceExcelSchema.safeParse({
      konk: "air",
      prod: "gemar",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
      metrics: "price,stock",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.metrics).toEqual(["stock", "price"]);
  });

  it("rejects invalid metrics", () => {
    const result = getKonkSkuSliceExcelSchema.safeParse({
      konk: "air",
      prod: "gemar",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
      metrics: "revenue",
    });
    expect(result.success).toBe(false);
  });
});
