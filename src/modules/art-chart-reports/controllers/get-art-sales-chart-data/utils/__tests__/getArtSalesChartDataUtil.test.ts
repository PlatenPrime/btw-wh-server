import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getArtSalesChartDataUtil } from "../getArtSalesChartDataUtil.js";

describe("getArtSalesChartDataUtil", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSlice.deleteMany({});
  });

  it("returns sales chart summary totals", async () => {
    await Art.create({ artikul: "ART-1", zone: "A" });
    const d0 = new Date("2026-02-28T00:00:00.000Z");
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await BtradeSlice.insertMany([
      { date: d0, data: { "ART-1": { quantity: 10, price: 2 } } },
      { date: d1, data: { "ART-1": { quantity: 8, price: 2 } } },
      { date: d2, data: { "ART-1": { quantity: 5, price: 2 } } },
    ]);

    const r = await getArtSalesChartDataUtil({
      artikul: "ART-1",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.days).toHaveLength(2);
      expect(r.data.days[0]!.sales).toBe(2);
      expect(r.data.days[1]!.sales).toBe(3);
      expect(r.data.summary.totalSales).toBe(5);
      expect(r.data.summary.totalRevenue).toBe(10);
    }
  });
});
