import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Art } from "../../../arts/models/Art.js";
import { BtradeSlice } from "../../../btrade-slices/models/BtradeSlice.js";
import { BtradeManufacturerDaySales } from "../../models/BtradeManufacturerDaySales.js";
import {
  afterBtradeSliceStockMutation,
  materializeBtradeManufacturerSalesDateRange,
  materializeBtradeManufacturerSalesForDays,
} from "../materializeBtradeManufacturerSalesUtil.js";

describe("materializeBtradeManufacturerSalesUtil", () => {
  const d0 = new Date("2026-06-01T00:00:00.000Z");
  const d1 = new Date("2026-06-02T00:00:00.000Z");
  const d2 = new Date("2026-06-03T00:00:00.000Z");

  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSlice.deleteMany({});
    await BtradeManufacturerDaySales.deleteMany({});
    await Art.create({ artikul: "A1", prodName: "Gemar", zone: "Z" });
    await Art.create({ artikul: "A2", prodName: "Gemar", zone: "Z" });
    await Art.create({ artikul: "B1", prodName: "Other", zone: "Z" });
  });

  it("writes rollup by lowercased prodName for D and D+1", async () => {
    await BtradeSlice.insertMany([
      {
        date: d0,
        data: {
          A1: { quantity: 10, price: 5 },
          A2: { quantity: 20, price: 2 },
          B1: { quantity: 8, price: 3 },
        },
      },
      {
        date: d1,
        data: {
          A1: { quantity: 7, price: 5 },
          A2: { quantity: 18, price: 2 },
          B1: { quantity: 6, price: 3 },
        },
      },
      {
        date: d2,
        data: {
          A1: { quantity: 5, price: 5 },
          A2: { quantity: 15, price: 2 },
          B1: { quantity: 5, price: 3 },
        },
      },
    ]);

    const r = await materializeBtradeManufacturerSalesForDays({
      dayD: d1,
      apply: true,
    });
    expect(r.daysTouched).toEqual(["2026-06-02", "2026-06-03"]);

    const mid = await BtradeManufacturerDaySales.find({ date: d1 })
      .sort({ prodName: 1 })
      .lean();
    expect(mid).toHaveLength(2);
    expect(mid[0]).toMatchObject({
      prodName: "gemar",
      salesPcs: 5, // 3+2
      salesUah: 19, // 15+4
    });
    expect(mid[1]).toMatchObject({
      prodName: "other",
      salesPcs: 2,
      salesUah: 6,
    });
  });

  it("zeros sales when quantity is -1", async () => {
    await BtradeSlice.insertMany([
      { date: d0, data: { A1: { quantity: 10, price: 5 } } },
      { date: d1, data: { A1: { quantity: -1, price: -1 } } },
    ]);
    await afterBtradeSliceStockMutation({ dayD: d1 });
    const row = await BtradeManufacturerDaySales.findOne({
      date: d1,
      prodName: "gemar",
    }).lean();
    expect(row).toMatchObject({ salesPcs: 0, salesUah: 0 });
  });

  it("dry-run does not write", async () => {
    await BtradeSlice.insertMany([
      { date: d0, data: { A1: { quantity: 10, price: 5 } } },
      { date: d1, data: { A1: { quantity: 7, price: 5 } } },
    ]);
    const r = await materializeBtradeManufacturerSalesForDays({
      dayD: d1,
      apply: false,
    });
    expect(r.rollupDocs).toBeGreaterThan(0);
    expect(await BtradeManufacturerDaySales.countDocuments({})).toBe(0);
  });

  it("dateRange calls onProgress", async () => {
    await BtradeSlice.insertMany([
      { date: d0, data: { A1: { quantity: 10, price: 5 } } },
      { date: d1, data: { A1: { quantity: 7, price: 5 } } },
      { date: d2, data: { A1: { quantity: 4, price: 5 } } },
    ]);
    const progress: string[] = [];
    await materializeBtradeManufacturerSalesDateRange({
      fromDate: d1,
      toDate: d2,
      apply: true,
      onProgress: ({ day }) => {
        progress.push(day);
      },
    });
    expect(progress).toEqual(["2026-06-02", "2026-06-03"]);
    expect(await BtradeManufacturerDaySales.countDocuments({})).toBe(2);
  });
});
