import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../konks/models/Konk.js";
import { aggregateDailySkuSliceMetricsForSkus } from "../aggregateDailySkuSliceMetricsForSkus.js";
import { aggregatePeriodSkuSliceMetricsForSkus } from "../aggregatePeriodSkuSliceMetricsForSkus.js";
import { seedSkuSliceMonthDay } from "../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../sku-slices/models/SkuSliceMonth.js";

describe("aggregatePeriodSkuSliceMetricsForSkus", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("returns ok:false for empty sku list", async () => {
    const r = await aggregatePeriodSkuSliceMetricsForSkus(
      [],
      new Date("2026-04-02T00:00:00.000Z"),
      new Date("2026-04-03T00:00:00.000Z"),
    );
    expect(r.ok).toBe(false);
  });

  it("returns per-sku period totals aligned with input order", async () => {
    const d0 = new Date("2026-04-01T00:00:00.000Z");
    const d1 = new Date("2026-04-02T00:00:00.000Z");
    const d2 = new Date("2026-04-03T00:00:00.000Z");

    await seedSkuSliceMonthDay("k", d0, {
          "p-a": { stock: 10, price: 5 },
          "p-b": { stock: 20, price: 10 },
        });
    await seedSkuSliceMonthDay("k", d1, {
          "p-a": { stock: 7, price: 5 },
          "p-b": { stock: 18, price: 10 },
        });
    await seedSkuSliceMonthDay("k", d2, {
          "p-a": { stock: 5, price: 5 },
          "p-b": { stock: 15, price: 10 },
        });

    const skus = [
      { konkName: "k", productId: "p-a" },
      { konkName: "k", productId: "p-b" },
    ];

    const period = await aggregatePeriodSkuSliceMetricsForSkus(skus, d1, d2);
    expect(period.ok).toBe(true);
    if (!period.ok) return;

    expect(period.data).toHaveLength(2);
    // p-a: sales 3 + 2 = 5, revenue 15 + 10 = 25
    expect(period.data[0]).toEqual({ salesPcs: 5, salesUah: 25 });
    // p-b: sales 2 + 3 = 5, revenue 20 + 30 = 50
    expect(period.data[1]).toEqual({ salesPcs: 5, salesUah: 50 });

    const daily = await aggregateDailySkuSliceMetricsForSkus(skus, d1, d2);
    expect(daily.ok).toBe(true);
    if (!daily.ok) return;

    const dailySumPcs = daily.data.reduce((s, d) => s + d.sales, 0);
    const dailySumUah = daily.data.reduce((s, d) => s + d.revenue, 0);
    const periodSumPcs = period.data.reduce((s, d) => s + d.salesPcs, 0);
    const periodSumUah = period.data.reduce((s, d) => s + d.salesUah, 0);

    expect(periodSumPcs).toBe(dailySumPcs);
    expect(periodSumUah).toBe(Math.round(dailySumUah * 100) / 100);
  });

  it("forces sales and revenue to zero on recount days", async () => {
    const d0 = new Date("2026-04-01T00:00:00.000Z");
    const d1 = new Date("2026-04-02T00:00:00.000Z");
    const d2 = new Date("2026-04-03T00:00:00.000Z");

    await Konk.create({
      name: "k-recount",
      title: "K recount",
      url: "https://example.com",
      imageUrl: "https://example.com/k.png",
      recountDays: ["2026-04-02"],
    });

    await seedSkuSliceMonthDay("k-recount", d0, { "p-1": { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay("k-recount", d1, { "p-1": { stock: 7, price: 5 } });
    await seedSkuSliceMonthDay("k-recount", d2, { "p-1": { stock: 5, price: 5 } });

    const r = await aggregatePeriodSkuSliceMetricsForSkus(
      [{ konkName: "k-recount", productId: "p-1" }],
      d1,
      d2,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // recount day sales 0; day2 sales 2 → revenue 10
    expect(r.data[0]).toEqual({ salesPcs: 2, salesUah: 10 });
  });

  it("keeps zero-sales sku rows", async () => {
    const d0 = new Date("2026-04-01T00:00:00.000Z");
    const d1 = new Date("2026-04-02T00:00:00.000Z");

    await seedSkuSliceMonthDay("k", d0, { "p-flat": { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay("k", d1, { "p-flat": { stock: 10, price: 5 } });

    const r = await aggregatePeriodSkuSliceMetricsForSkus(
      [{ konkName: "k", productId: "p-flat" }],
      d1,
      d1,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data[0]).toEqual({ salesPcs: 0, salesUah: 0 });
  });
});
