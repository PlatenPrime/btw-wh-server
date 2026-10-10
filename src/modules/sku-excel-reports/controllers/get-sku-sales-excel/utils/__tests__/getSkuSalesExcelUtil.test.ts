import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { getSkuSalesExcelUtil } from "../getSkuSalesExcelUtil.js";
import { seedSkuSliceMonthDay } from "../../../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../../../sku-slices/models/SkuSliceMonth.js";

describe("getSkuSalesExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("returns ok false when sku missing", async () => {
    const result = await getSkuSalesExcelUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok true with buffer when sku and slices exist", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-sales-xls-1",
      title: "Sales Item",
      url: "https://example.com/sales",
    });
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", d1, { "air-sales-xls-1": { stock: 10, price: 7 } });
    await seedSkuSliceMonthDay("air", d2, { "air-sales-xls-1": { stock: 6, price: 7 } });

    const result = await getSkuSalesExcelUtil({
      skuId: sku._id.toString(),
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.buffer.length).toBeGreaterThan(100);
      expect(result.fileName).toContain("sku_sales");
      expect(result.fileName).toContain("air-sales-xls-1");
    }
  });
});
