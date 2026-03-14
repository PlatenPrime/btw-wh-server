import { describe, expect, it } from "vitest";
import { Analog } from "../../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../../models/AnalogSlice.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getKonkBtradeStockComparisonUtil } from "../getKonkBtradeStockComparisonUtil.js";

describe("getKonkBtradeStockComparisonUtil", () => {
  it("returns ok: false when no analogs for konk/prod", async () => {
    const result = await getKonkBtradeStockComparisonUtil({
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

    const result = await getKonkBtradeStockComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-03T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("aggregates daily stock across multiple analogs", async () => {
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

    const result = await getKonkBtradeStockComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { days, summary } = result.data;

    expect(days).toHaveLength(3);

    expect(days[0]).toMatchObject({
      date: "2026-03-01T00:00:00.000Z",
      competitorStock: 150, // 100 + 50
      btradeStock: 300,     // 200 + 100
    });

    expect(days[1]).toMatchObject({
      date: "2026-03-02T00:00:00.000Z",
      competitorStock: 130, // 90 + 40
      btradeStock: 275,     // 185 + 90
    });

    expect(days[2]).toMatchObject({
      date: "2026-03-03T00:00:00.000Z",
      competitorStock: 115, // 80 + 35
      btradeStock: 250,     // 170 + 80
    });

    expect(summary.firstDayCompetitorStock).toBe(150);
    expect(summary.lastDayCompetitorStock).toBe(115);
    expect(summary.firstDayBtradeStock).toBe(300);
    expect(summary.lastDayBtradeStock).toBe(250);
    expect(summary.diffCompetitorStock).toBe(-35);  // 115 - 150
    expect(summary.diffBtradeStock).toBe(-50);       // 250 - 300

    // diffCompetitorStockPct = (-35 / 150) * 100 = -23.333... rounded to -23.33
    expect(summary.diffCompetitorStockPct).toBeCloseTo(-23.33, 1);
    // diffBtradeStockPct = (-50 / 300) * 100 = -16.666... rounded to -16.67
    expect(summary.diffBtradeStockPct).toBeCloseTo(-16.67, 1);
  });

  it("treats null stock as 0", async () => {
    const artikul = "1102-0300";

    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/a-null",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");

    // No AnalogSlice data => analogStock will be null => treated as 0
    await BtradeSlice.insertMany([
      { date: d1, data: { [artikul]: { quantity: 100, price: 12 } } },
      { date: d2, data: { [artikul]: { quantity: 90, price: 12 } } },
    ]);

    const result = await getKonkBtradeStockComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.days[0]!.competitorStock).toBe(0);
    expect(result.data.days[0]!.btradeStock).toBe(100);
    expect(result.data.days[1]!.competitorStock).toBe(0);
    expect(result.data.days[1]!.btradeStock).toBe(90);
  });

  it("returns null for diffCompetitorStockPct when first day competitor stock is zero", async () => {
    const artikul = "1102-0301";

    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/a-zero",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");

    // No competitor slices at all => competitor stock = 0 => pct = null
    await BtradeSlice.insertMany([
      { date: d1, data: { [artikul]: { quantity: 100, price: 12 } } },
      { date: d2, data: { [artikul]: { quantity: 90, price: 12 } } },
    ]);

    const result = await getKonkBtradeStockComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.summary.firstDayCompetitorStock).toBe(0);
    expect(result.data.summary.diffCompetitorStockPct).toBeNull();
  });

  it("returns null for diffBtradeStockPct when first day btrade stock is zero", async () => {
    const artikul = "1102-0302";

    await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/a-zero-bt",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");

    await AnalogSlice.insertMany([
      { konkName: "air", date: d1, data: { [artikul]: { stock: 50, price: 10 } } },
      { konkName: "air", date: d2, data: { [artikul]: { stock: 40, price: 10 } } },
    ]);

    // No btrade slices => btrade stock = 0 => pct = null
    const result = await getKonkBtradeStockComparisonUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.summary.firstDayBtradeStock).toBe(0);
    expect(result.data.summary.diffBtradeStockPct).toBeNull();
  });
});
