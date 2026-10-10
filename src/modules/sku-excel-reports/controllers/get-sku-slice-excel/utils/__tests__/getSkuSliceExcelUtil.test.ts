import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { getSkuSliceExcelUtil } from "../getSkuSliceExcelUtil.js";
import { seedSkuSliceMonthDay } from "../../../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../../../sku-slices/models/SkuSliceMonth.js";

describe("getSkuSliceExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("returns ok false when sku missing", async () => {
    const r = await getSkuSliceExcelUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("returns buffer when sku and slices exist", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-xls-1",
      title: "Item",
      url: "https://example.com/xls",
    });
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", d1, { "air-xls-1": { stock: 4, price: 9 } });
    await seedSkuSliceMonthDay("air", d2, { "air-xls-1": { stock: 2, price: 9 } });

    const r = await getSkuSliceExcelUtil({
      skuId: sku._id.toString(),
      dateFrom: d1,
      dateTo: d2,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.buffer.length).toBeGreaterThan(100);
      expect(r.fileName).toContain("air-xls-1");
    }
  });
});
