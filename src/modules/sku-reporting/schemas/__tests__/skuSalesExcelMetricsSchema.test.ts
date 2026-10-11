import { describe, expect, it } from "vitest";
import { skuSalesExcelMetricsSchema } from "../skuSalesExcelMetricsSchema.js";

describe("skuSalesExcelMetricsSchema", () => {
  it("returns undefined for empty or missing input", () => {
    expect(skuSalesExcelMetricsSchema.safeParse(undefined).success).toBe(true);
    expect(skuSalesExcelMetricsSchema.safeParse("").success).toBe(true);
    expect(skuSalesExcelMetricsSchema.safeParse(null).success).toBe(true);
    const empty = skuSalesExcelMetricsSchema.safeParse(undefined);
    if (!empty.success) return;
    expect(empty.data).toBeUndefined();
  });

  it("parses CSV into canonical unique order", () => {
    const result = skuSalesExcelMetricsSchema.safeParse("revenue, sales,revenue");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["sales", "revenue"]);
  });

  it("parses array query values into canonical order", () => {
    const result = skuSalesExcelMetricsSchema.safeParse(["price", "sales"]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["sales", "price"]);
  });

  it("accepts single metric", () => {
    const result = skuSalesExcelMetricsSchema.safeParse("revenue");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["revenue"]);
  });

  it("rejects invalid metric values", () => {
    const result = skuSalesExcelMetricsSchema.safeParse("stock");
    expect(result.success).toBe(false);
  });
});
