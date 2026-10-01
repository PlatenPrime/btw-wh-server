import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { patchSkuSliceByDatePeriodsUtil } from "../patchSkuSliceByDatePeriodsUtil.js";

describe("patchSkuSliceByDatePeriodsUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("writes same values across multiple periods", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-periods",
      title: "T",
      url: "https://perfect.example/p",
    });
    const d1 = new Date("2026-09-20T00:00:00.000Z");
    const d2 = new Date("2026-09-21T00:00:00.000Z");
    const d10 = new Date("2026-09-30T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "perfect",
      date: d2,
      data: { "perfect-periods": { stock: 60, price: 5.5 } },
    });

    const result = await patchSkuSliceByDatePeriodsUtil({
      skuId: sku._id.toString(),
      periods: [
        { dateFrom: d1, dateTo: d2 },
        { dateFrom: d10, dateTo: d10 },
      ],
      stock: 3,
      price: 110,
    });

    expect(result).not.toBeNull();
    expect(result!.productId).toBe("perfect-periods");
    expect(result!.updatedCount).toBe(3);
    expect(result!.days).toHaveLength(3);
    expect(result!.periods).toHaveLength(2);
    expect(result!.days[0]).toMatchObject({
      date: d1,
      previous: null,
      created: true,
    });
    expect(result!.days[1]).toMatchObject({
      date: d2,
      previous: { stock: 60, price: 5.5 },
      created: false,
    });
    expect(result!.days[2]).toMatchObject({
      date: d10,
      previous: null,
      created: true,
    });

    for (const date of [d1, d2, d10]) {
      const stored = await SkuSlice.findOne({
        konkName: "perfect",
        date,
      }).lean();
      expect(stored?.data["perfect-periods"]).toEqual({
        stock: 3,
        price: 110,
      });
    }
  });

  it("dedupes overlapping periods to unique days", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-overlap",
      title: "T",
      url: "https://perfect.example/o",
    });

    const result = await patchSkuSliceByDatePeriodsUtil({
      skuId: sku._id.toString(),
      periods: [
        {
          dateFrom: new Date("2026-09-20T00:00:00.000Z"),
          dateTo: new Date("2026-09-22T00:00:00.000Z"),
        },
        {
          dateFrom: new Date("2026-09-21T00:00:00.000Z"),
          dateTo: new Date("2026-09-23T00:00:00.000Z"),
        },
      ],
      stock: 3,
      price: 110,
    });

    expect(result).not.toBeNull();
    expect(result!.updatedCount).toBe(4);
    expect(result!.days).toHaveLength(4);
  });

  it("returns null when sku is missing", async () => {
    const result = await patchSkuSliceByDatePeriodsUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      periods: [
        {
          dateFrom: new Date("2026-09-20T00:00:00.000Z"),
          dateTo: new Date("2026-09-21T00:00:00.000Z"),
        },
      ],
      stock: 1,
      price: 2,
    });
    expect(result).toBeNull();
  });
});
