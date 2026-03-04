import { describe, expect, it } from "vitest";
import { Analog } from "../../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../../models/AnalogSlice.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getAnalogBtradeComparisonRangeUtil } from "../getAnalogBtradeComparisonRangeUtil.js";

describe("getAnalogBtradeComparisonRangeUtil", () => {
  it("returns ok: false when analog not found", async () => {
    const result = await getAnalogBtradeComparisonRangeUtil({
      analogId: "69a2de17f8a2a9cb9a8a75df",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-31T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok: false when analog has no artikul", async () => {
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul: "",
      url: "https://example.com/product-no-artikul-comparison",
    });

    const result = await getAnalogBtradeComparisonRangeUtil({
      analogId: analog._id.toString(),
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-31T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns comparison data for dates where analog and/or Btrade slices exist", async () => {
    const artikul = "1102-0259";
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/product-comparison",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const d3 = new Date("2026-03-03T00:00:00.000Z");

    await AnalogSlice.insertMany([
      {
        konkName: "air",
        date: d1,
        data: { [artikul]: { stock: 0, price: 1.5 } },
      },
      {
        konkName: "air",
        date: d2,
        data: { [artikul]: { stock: 1, price: 1.6 } },
      },
    ]);

    await BtradeSlice.insertMany([
      {
        date: d2,
        data: { [artikul]: { quantity: 10, price: 2.0 } },
      },
      {
        date: d3,
        data: { [artikul]: { quantity: 20, price: 2.2 } },
      },
    ]);

    const result = await getAnalogBtradeComparisonRangeUtil({
      analogId: analog._id.toString(),
      dateFrom: d1,
      dateTo: d3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { data } = result;
    // d1: только аналог, d2: оба, d3: только Btrade
    expect(data).toHaveLength(3);
    expect(data[0]).toMatchObject({
      analogStock: 0,
      analogPrice: 1.5,
      btradeStock: null,
      btradePrice: null,
    });
    expect(data[1]).toMatchObject({
      analogStock: 1,
      analogPrice: 1.6,
      btradeStock: 10,
      btradePrice: 2.0,
    });
    expect(data[2]).toMatchObject({
      analogStock: null,
      analogPrice: null,
      btradeStock: 20,
      btradePrice: 2.2,
    });
  });

  it("includes dates even when neither analog nor Btrade has data", async () => {
    const artikul = "1102-0259";
    const analog = await Analog.create({
      konkName: "air",
      prodName: "gemar",
      artikul,
      url: "https://example.com/product-comparison-empty-days",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const d3 = new Date("2026-03-03T00:00:00.000Z");

    await AnalogSlice.create({
      konkName: "air",
      date: d1,
      data: { [artikul]: { stock: 5, price: 1.7 } },
    });

    const result = await getAnalogBtradeComparisonRangeUtil({
      analogId: analog._id.toString(),
      dateFrom: d1,
      dateTo: d3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { data } = result;
    expect(data).toHaveLength(3);
    expect(data[0].date.toISOString()).toBe(d1.toISOString());
    expect(data[1].date.toISOString()).toBe(d2.toISOString());
    expect(data[2].date.toISOString()).toBe(d3.toISOString());

    expect(data[0].analogStock).toBe(5);
    expect(data[1].analogStock).toBeNull();
    expect(data[2].analogStock).toBeNull();
  });
});

