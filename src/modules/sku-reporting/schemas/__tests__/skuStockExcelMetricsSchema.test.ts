import { describe, expect, it } from "vitest";
import { skuStockExcelMetricsSchema } from "../skuStockExcelMetricsSchema.js";

describe("skuStockExcelMetricsSchema", () => {
  it("returns undefined for empty or missing input", () => {
    expect(skuStockExcelMetricsSchema.safeParse(undefined).success).toBe(true);
    expect(skuStockExcelMetricsSchema.safeParse("").success).toBe(true);
    expect(skuStockExcelMetricsSchema.safeParse(null).success).toBe(true);
    const empty = skuStockExcelMetricsSchema.safeParse(undefined);
    if (!empty.success) return;
    expect(empty.data).toBeUndefined();
  });

  it("parses CSV into canonical unique order", () => {
    const result = skuStockExcelMetricsSchema.safeParse("price, stock,price");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["stock", "price"]);
  });

  it("parses array query values into canonical order", () => {
    const result = skuStockExcelMetricsSchema.safeParse(["price", "stock"]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["stock", "price"]);
  });

  it("accepts single metric", () => {
    const result = skuStockExcelMetricsSchema.safeParse("stock");
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual(["stock"]);
  });

  it("rejects invalid metric values", () => {
    const result = skuStockExcelMetricsSchema.safeParse("sales");
    expect(result.success).toBe(false);
  });
});
