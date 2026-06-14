import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { BtradeSlice } from "../../../btrade-slices/models/BtradeSlice.js";
import {
  computeArtSalesPointsFromSeries,
  loadArtBtradeSliceSeries,
  quantityForChart,
} from "../loadArtBtradeSliceSeries.js";

describe("loadArtBtradeSliceSeries", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSlice.deleteMany({});
  });

  it("returns ok false when art missing", async () => {
    const r = await loadArtBtradeSliceSeries({
      artikul: "missing-art",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("loads coalesced series for artikul", async () => {
    await Art.create({
      artikul: "ART-1",
      zone: "A",
      nameukr: "Товар",
    });
    const d0 = new Date("2026-02-28T00:00:00.000Z");
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await BtradeSlice.insertMany([
      { date: d0, data: { "ART-1": { quantity: 10, price: 50 } } },
      { date: d1, data: { "ART-1": { quantity: 8, price: 50 } } },
      { date: d2, data: { "ART-1": { quantity: 6, price: 55 } } },
    ]);

    const result = await loadArtBtradeSliceSeries({
      artikul: "ART-1",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artNameUkr).toBe("Товар");
    expect(result.datesReport).toHaveLength(2);
    expect(result.coalescedReport[0]!.quantity).toBe(8);
    expect(result.coalescedReport[1]!.price).toBe(55);
  });

  it("computeArtSalesPointsFromSeries derives sales from quantity", () => {
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const coalescedFull = [
      { quantity: 10, price: 2 },
      { quantity: 10, price: 2 },
      { quantity: 7, price: 2 },
    ];
    const points = computeArtSalesPointsFromSeries(
      [d1, d2],
      coalescedFull,
      1,
    );
    expect(points[0]!.sales).toBe(0);
    expect(points[1]!.sales).toBe(3);
    expect(points[1]!.revenue).toBe(6);

    const singleDay = computeArtSalesPointsFromSeries(
      [d2],
      coalescedFull,
      2,
    );
    expect(singleDay[0]!.sales).toBe(3);
  });

  it("quantityForChart defaults null to 0", () => {
    expect(quantityForChart(null)).toBe(0);
    expect(quantityForChart(5)).toBe(5);
  });
});
