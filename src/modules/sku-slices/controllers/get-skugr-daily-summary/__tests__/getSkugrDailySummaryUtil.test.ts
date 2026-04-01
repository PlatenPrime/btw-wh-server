import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkugrDailySummaryUtil } from "../utils/getSkugrDailySummaryUtil.js";

describe("getSkugrDailySummaryUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("aggregates stock, sales and revenue across skus by calendar day", async () => {
    const s1 = await Sku.create({
      konkName: "agg-k",
      prodName: "p1",
      productId: "agg-k-a",
      title: "A",
      url: "https://e.com/a",
    });
    const s2 = await Sku.create({
      konkName: "agg-k",
      prodName: "p1",
      productId: "agg-k-b",
      title: "B",
      url: "https://e.com/b",
    });
    const skugr = await Skugr.create({
      konkName: "agg-k",
      prodName: "p1",
      title: "G",
      url: "https://e.com/g",
      isSliced: true,
      skus: [s1._id, s2._id],
    });

    const d1 = new Date("2026-06-01T00:00:00.000Z");
    const d2 = new Date("2026-06-02T00:00:00.000Z");
    await SkuSlice.insertMany([
      {
        konkName: "agg-k",
        date: d1,
        data: {
          "agg-k-a": { stock: 10, price: 2 },
          "agg-k-b": { stock: 5, price: 4 },
        },
      },
      {
        konkName: "agg-k",
        date: d2,
        data: {
          "agg-k-a": { stock: 8, price: 2 },
          "agg-k-b": { stock: 3, price: 4 },
        },
      },
    ]);

    const result = await getSkugrDailySummaryUtil({
      skugrId: skugr._id.toString(),
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      date: d1.toISOString(),
      stock: 15,
      sales: 0,
      revenue: 0,
    });
    expect(result.data[1]).toMatchObject({
      date: d2.toISOString(),
      stock: 11,
      sales: 4,
      revenue: 12,
    });
  });

  it("returns ok false when skugr missing", async () => {
    const r = await getSkugrDailySummaryUtil({
      skugrId: "507f1f77bcf86cd799439011",
      dateFrom: new Date("2026-06-01T00:00:00.000Z"),
      dateTo: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("returns ok false when skugr has no reportable skus", async () => {
    const skugr = await Skugr.create({
      konkName: "agg-k",
      prodName: "p1",
      title: "Empty",
      url: "https://e.com/e",
      isSliced: true,
      skus: [],
    });
    const r = await getSkugrDailySummaryUtil({
      skugrId: skugr._id.toString(),
      dateFrom: new Date("2026-06-01T00:00:00.000Z"),
      dateTo: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });
});
