import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSalesRangeUtil } from "../utils/getSkuSalesRangeUtil.js";

describe("getSkuSalesRangeUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns ok false when sku missing", async () => {
    const r = await getSkuSalesRangeUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("returns sales array for days with slice data", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-sr1",
      title: "T",
      url: "https://example.com/sr1",
    });
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await SkuSlice.insertMany([
      { konkName: "air", date: d1, data: { "air-sr1": { stock: 5, price: 2 } } },
      { konkName: "air", date: d2, data: { "air-sr1": { stock: 3, price: 2 } } },
    ]);

    const result = await getSkuSalesRangeUtil({
      skuId: sku._id.toString(),
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.date).toBe(d1.toISOString());
      expect(result.data[0]!.price).toBe(2);
      expect(result.data[1]!.date).toBe(d2.toISOString());
    }
  });
});
