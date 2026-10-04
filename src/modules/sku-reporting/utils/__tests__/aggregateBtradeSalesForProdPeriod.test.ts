import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { BtradeSlice } from "../../../btrade-slices/models/BtradeSlice.js";
import { aggregateBtradeSalesForProdPeriod } from "../aggregateBtradeSalesForProdPeriod.js";

describe("aggregateBtradeSalesForProdPeriod", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSlice.deleteMany({});
  });

  it("returns ok false when no arts for prod", async () => {
    const result = await aggregateBtradeSalesForProdPeriod({
      prod: "missing",
      dateFrom: new Date("2026-09-01T00:00:00.000Z"),
      dateTo: new Date("2026-09-02T00:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
  });

  it("sums sales and revenue for matching prod", async () => {
    const prod = "bt-prod";
    const btArt = "BT-AGG-1";
    const d0 = new Date("2026-08-31T00:00:00.000Z");
    const d1 = new Date("2026-09-01T00:00:00.000Z");
    const d2 = new Date("2026-09-02T00:00:00.000Z");

    await Art.create({ artikul: btArt, prodName: prod, zone: "Z" });
    await BtradeSlice.insertMany([
      { date: d0, data: { [btArt]: { quantity: 45, price: 10 } } },
      { date: d1, data: { [btArt]: { quantity: 40, price: 10 } } },
      { date: d2, data: { [btArt]: { quantity: 35, price: 10 } } },
    ]);

    const result = await aggregateBtradeSalesForProdPeriod({
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.salesPcs).toBe(10);
    expect(result.salesUah).toBe(100);
  });

  it("filters arts by prodNamesLower when provided", async () => {
    const keep = "KeepProd";
    const drop = "DropProd";
    const keepArt = "BT-KEEP";
    const dropArt = "BT-DROP";
    const d0 = new Date("2026-08-31T00:00:00.000Z");
    const d1 = new Date("2026-09-01T00:00:00.000Z");

    await Art.insertMany([
      { artikul: keepArt, prodName: keep, zone: "Z" },
      { artikul: dropArt, prodName: drop, zone: "Z" },
    ]);
    await BtradeSlice.insertMany([
      {
        date: d0,
        data: {
          [keepArt]: { quantity: 20, price: 5 },
          [dropArt]: { quantity: 50, price: 5 },
        },
      },
      {
        date: d1,
        data: {
          [keepArt]: { quantity: 15, price: 5 },
          [dropArt]: { quantity: 40, price: 5 },
        },
      },
    ]);

    const result = await aggregateBtradeSalesForProdPeriod({
      dateFrom: d1,
      dateTo: d1,
      prodNamesLower: [keep.toLowerCase()],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.salesPcs).toBe(5);
    expect(result.salesUah).toBe(25);
  });
});
