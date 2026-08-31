import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceRangeUtil } from "../utils/getSkuSliceRangeUtil.js";

describe("getSkuSliceRangeUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns dense range with forward-fill when only one day scraped", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-range-1",
      title: "T",
      url: "https://example.com/r1",
    });
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const d3 = new Date("2026-03-03T00:00:00.000Z");
    await SkuSlice.insertMany([
      { konkName: "air", date: d1, data: { "air-range-1": { stock: 1, price: 10 } } },
    ]);

    const result = await getSkuSliceRangeUtil({
      skuId: sku._id.toString(),
      dateFrom: d1,
      dateTo: d3,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        date: d1.toISOString(),
        stock: 1,
        price: 10,
      });
      expect(result.data[1]).toEqual({
        date: d2.toISOString(),
        stock: 1,
        price: 10,
      });
      expect(result.data[2]).toEqual({
        date: d3.toISOString(),
        stock: 1,
        price: 10,
      });
    }
  });

  it("returns slice points for date range", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-range-1",
      title: "T",
      url: "https://example.com/r1",
    });
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await SkuSlice.insertMany([
      { konkName: "air", date: d1, data: { "air-range-1": { stock: 1, price: 10 } } },
      { konkName: "air", date: d2, data: { "air-range-1": { stock: 2, price: 11 } } },
    ]);

    const result = await getSkuSliceRangeUtil({
      skuId: sku._id.toString(),
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        date: d1.toISOString(),
        stock: 1,
        price: 10,
      });
      expect(result.data[1]).toEqual({
        date: d2.toISOString(),
        stock: 2,
        price: 11,
      });
    }
  });

  it("returns ok false when sku not found", async () => {
    const r = await getSkuSliceRangeUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });
});
