import { describe, expect, it } from "vitest";
import { konkProdRangeSchema } from "../../../../../sku-reporting/schemas/konkProdRangeSchema.js";
import { getKonkProdSkuStockChartDataSchema } from "../getKonkProdSkuStockChartDataSchema.js";

describe("getKonkProdSkuStockChartDataSchema", () => {
  it("re-exports konkProdRangeSchema", () => {
    expect(getKonkProdSkuStockChartDataSchema).toBe(konkProdRangeSchema);
  });

  it("accepts prod=all", () => {
    const result = getKonkProdSkuStockChartDataSchema.safeParse({
      konk: "k",
      prod: "all",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-01",
    });
    expect(result.success).toBe(true);
  });
});
