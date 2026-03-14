import { describe, expect, it } from "vitest";
import { Analog } from "../../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../../models/AnalogSlice.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getKonkBtradeSalesComparisonUtil } from "../getKonkBtradeSalesComparisonUtil.js";

describe("getKonkBtradeSalesComparisonUtil", () => {
  it("returns ok: false when no analogs for konk/prod", async () => {
    const result = await getKonkBtradeSalesComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-03T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok: false when all analogs have empty artikul", async () => {
    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "",
      url: "https://example.com/no-artikul",
    });

    const result = await getKonkBtradeSalesComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-03T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("aggregates daily sales and revenue across multiple analogs", async () => {
    const artikul1 = "1102-0259";
    const artikul2 = "1102-0260";

    await Analog.insertMany([
      { konkName: "air", prodName: "gemar", artikul: artikul1, url: "https://example.com/a1" },
      { konkName: "air", prodName: "gemar", artikul: artikul2, url: "https://example.com/a2" },
    ]);

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const d3 = new Date("2026-03-03T00:00:00.000Z");

    await AnalogSlice.insertMany([
      {
        konkName: "air",
        date: d1,
        data: {
          [artikul1]: { stock: 100, price: 10 },
          [artikul2]: { stock: 50, price: 20 },
        },
      },
      {
        konkName: "air",
        date: d2,
        data: {
          [artikul1]: { stock: 90, price: 10 },
          [artikul2]: { stock: 40, price: 20 },
        },
      },
      {
        konkName: "air",
        date: d3,
        data: {
          [artikul1]: { stock: 80, price: 10 },
          [artikul2]: { stock: 35, price: 20 },
        },
      },
    ]);

    await BtradeSlice.insertMany([
      {
        date: d1,
        data: {
          [artikul1]: { quantity: 200, price: 12 },
          [artikul2]: { quantity: 100, price: 22 },
        },
      },
      {
        date: d2,
        data: {
          [artikul1]: { quantity: 185, price: 12 },
          [artikul2]: { quantity: 90, price: 22 },
        },
      },
      {
        date: d3,
        data: {
          [artikul1]: { quantity: 170, price: 12 },
          [artikul2]: { quantity: 80, price: 22 },
        },
      },
    ]);

    const result = await getKonkBtradeSalesComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { days, summary } = result.data;

    expect(days).toHaveLength(3);

    // Day 1: no previous day => all sales = 0
    expect(days[0]).toMatchObject({
      date: "2026-03-01T00:00:00.000Z",
      competitorSales: 0,
      competitorRevenue: 0,
      btradeSales: 0,
      btradeRevenue: 0,
    });

    // Day 2: artikul1 competitor: 100-90=10, btrade: 200-185=15; artikul2 competitor: 50-40=10, btrade: 100-90=10
    expect(days[1]).toMatchObject({
      date: "2026-03-02T00:00:00.000Z",
      competitorSales: 20,       // 10 + 10
      competitorRevenue: 300,    // 10*10 + 10*20
      btradeSales: 25,           // 15 + 10
      btradeRevenue: 400,        // 15*12 + 10*22
    });

    // Day 3: artikul1 competitor: 90-80=10, btrade: 185-170=15; artikul2 competitor: 40-35=5, btrade: 90-80=10
    expect(days[2]).toMatchObject({
      date: "2026-03-03T00:00:00.000Z",
      competitorSales: 15,       // 10 + 5
      competitorRevenue: 200,    // 10*10 + 5*20
      btradeSales: 25,           // 15 + 10
      btradeRevenue: 400,        // 15*12 + 10*22
    });

    // Summary: totals across all days
    expect(summary.totalCompetitorSales).toBe(35);    // 0 + 20 + 15
    expect(summary.totalBtradeSales).toBe(50);         // 0 + 25 + 25
    expect(summary.totalCompetitorRevenue).toBe(500);  // 0 + 300 + 200
    expect(summary.totalBtradeRevenue).toBe(800);      // 0 + 400 + 400
    expect(summary.diffSalesPcs).toBe(15);             // 50 - 35
    expect(summary.diffRevenueUah).toBe(300);          // 800 - 500

    // diffSalesPct = (50/35 - 1) * 100 = 42.857... rounded to 42.86
    expect(summary.diffSalesPct).toBeCloseTo(42.86, 1);
    // diffRevenuePct = (800/500 - 1) * 100 = 60.00
    expect(summary.diffRevenuePct).toBeCloseTo(60, 1);
  });

  it("returns null for diffSalesPct when competitor sales are zero", async () => {
    const artikul = "1102-0300";

    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/a-zero",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");

    // Competitor stock stays the same (no sales)
    await AnalogSlice.insertMany([
      { konkName: "air", date: d1, data: { [artikul]: { stock: 50, price: 10 } } },
      { konkName: "air", date: d2, data: { [artikul]: { stock: 50, price: 10 } } },
    ]);

    // Btrade has sales
    await BtradeSlice.insertMany([
      { date: d1, data: { [artikul]: { quantity: 100, price: 12 } } },
      { date: d2, data: { [artikul]: { quantity: 90, price: 12 } } },
    ]);

    const result = await getKonkBtradeSalesComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.summary.totalCompetitorSales).toBe(0);
    expect(result.data.summary.diffSalesPct).toBeNull();
  });

  it("returns null for diffRevenuePct when competitor revenue is zero", async () => {
    const artikul = "1102-0301";

    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/a-zero-rev",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");

    // Competitor: no slices at all (null stock => 0 sales => 0 revenue)
    await BtradeSlice.insertMany([
      { date: d1, data: { [artikul]: { quantity: 100, price: 12 } } },
      { date: d2, data: { [artikul]: { quantity: 85, price: 12 } } },
    ]);

    const result = await getKonkBtradeSalesComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.summary.totalCompetitorRevenue).toBe(0);
    expect(result.data.summary.diffRevenuePct).toBeNull();
    expect(result.data.summary.diffSalesPct).toBeNull();
  });
});
