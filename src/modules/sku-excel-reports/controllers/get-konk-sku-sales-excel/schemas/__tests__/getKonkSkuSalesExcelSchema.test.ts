import { describe, expect, it } from "vitest";
import { getKonkSkuSalesExcelSchema } from "../getKonkSkuSalesExcelSchema.js";

describe("getKonkSkuSalesExcelSchema", () => {
  it("extends konkProdRangeSchema with optional sortBy", () => {
    const result = getKonkSkuSalesExcelSchema.safeParse({
      konk: "k",
      prod: "p",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
      sortBy: "revenue",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sortBy).toBe("revenue");
  });

  it("treats empty sortBy as undefined", () => {
    const result = getKonkSkuSalesExcelSchema.safeParse({
      konk: "k",
      prod: "p",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
      sortBy: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sortBy).toBeUndefined();
  });

  it("rejects invalid sortBy", () => {
    const result = getKonkSkuSalesExcelSchema.safeParse({
      konk: "k",
      prod: "p",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-02",
      sortBy: "price",
    });
    expect(result.success).toBe(false);
  });
});
