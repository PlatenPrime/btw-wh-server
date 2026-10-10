import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { patchSkuSliceByDateRangeUtil } from "../patchSkuSliceByDateRangeUtil.js";
import { seedSkuSliceMonthDay } from "../../../../utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../../models/SkuSliceMonth.js";
import { getDayPoint } from "../../../../utils/skuSliceMonthStore.js";

describe("patchSkuSliceByDateRangeUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("writes same values across range, creating missing days and overwriting existing", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-range",
      title: "T",
      url: "https://perfect.example/r",
    });
    const d1 = new Date("2026-09-20T00:00:00.000Z");
    const d2 = new Date("2026-09-21T00:00:00.000Z");
    const d3 = new Date("2026-09-22T00:00:00.000Z");
    await seedSkuSliceMonthDay("perfect", d2, { "perfect-range": { stock: 60, price: 5.5 } });

    const result = await patchSkuSliceByDateRangeUtil({
      skuId: sku._id.toString(),
      dateFrom: d1,
      dateTo: d3,
      stock: 3,
      price: 110,
    });

    expect(result).not.toBeNull();
    expect(result!.productId).toBe("perfect-range");
    expect(result!.updatedCount).toBe(3);
    expect(result!.days).toHaveLength(3);
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
      date: d3,
      previous: null,
      created: true,
    });

    for (const date of [d1, d2, d3]) {
      expect(await getDayPoint("perfect", "perfect-range", date)).toEqual({
        stock: 3,
        price: 110,
      });
    }
  });

  it("returns null when sku is missing", async () => {
    const result = await patchSkuSliceByDateRangeUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      dateFrom: new Date("2026-09-20T00:00:00.000Z"),
      dateTo: new Date("2026-09-21T00:00:00.000Z"),
      stock: 1,
      price: 2,
    });
    expect(result).toBeNull();
  });
});
