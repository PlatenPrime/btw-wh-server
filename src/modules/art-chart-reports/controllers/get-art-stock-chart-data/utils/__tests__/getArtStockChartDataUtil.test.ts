import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSliceMonth } from "../../../../../btrade-slices/models/BtradeSliceMonth.js";
import { seedBtradeSliceMonthDay } from "../../../../../btrade-slices/utils/seedBtradeSliceMonthDay.js";
import { getArtStockChartDataUtil } from "../getArtStockChartDataUtil.js";

describe("getArtStockChartDataUtil", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSliceMonth.deleteMany({});
  });

  it("returns ok false when art missing", async () => {
    const r = await getArtStockChartDataUtil({
      artikul: "missing",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("returns stock chart data with summary", async () => {
    await Art.create({ artikul: "ART-1", zone: "A" });
    const d0 = new Date("2026-02-28T00:00:00.000Z");
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await seedBtradeSliceMonthDay(d0, { "ART-1": { quantity: 10, price: 2 } });
    await seedBtradeSliceMonthDay(d1, { "ART-1": { quantity: 8, price: 2 } });
    await seedBtradeSliceMonthDay(d2, { "ART-1": { quantity: 5, price: 2 } });

    const r = await getArtStockChartDataUtil({
      artikul: "ART-1",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.days).toHaveLength(2);
      expect(r.data.summary.firstDayQuantity).toBe(8);
      expect(r.data.summary.lastDayQuantity).toBe(5);
      expect(r.data.summary.diffQuantity).toBe(-3);
    }
  });
});
