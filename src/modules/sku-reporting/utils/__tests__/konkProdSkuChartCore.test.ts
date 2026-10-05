import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { BtradeSlice } from "../../../btrade-slices/models/BtradeSlice.js";
import { Sku } from "../../../skus/models/Sku.js";
import { SkuSlice } from "../../../sku-slices/models/SkuSlice.js";
import { SkuManufacturerDaySales } from "../../models/SkuManufacturerDaySales.js";
import { BtradeManufacturerDaySales } from "../../models/BtradeManufacturerDaySales.js";
import { loadKonkProdSkuChartSeries } from "../konkProdSkuChartCore.js";

describe("loadKonkProdSkuChartSeries", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
    await BtradeSlice.deleteMany({});
    await Art.deleteMany({});
    await SkuManufacturerDaySales.deleteMany({});
    await BtradeManufacturerDaySales.deleteMany({});
  });

  it("returns ok false when no skus for konk/prod", async () => {
    const result = await loadKonkProdSkuChartSeries({
      konk: "missing",
      prod: "p",
      dateFrom: new Date("2026-09-01T00:00:00.000Z"),
      dateTo: new Date("2026-09-01T00:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
  });

  it("loads competitor sales from rollup and stock from Mixed", async () => {
    const konk = "core-k";
    const prod = "core-p";
    const btArt = "CORE-BT-1";
    const d0 = new Date("2026-08-31T00:00:00.000Z");
    const d1 = new Date("2026-09-01T00:00:00.000Z");
    const d2 = new Date("2026-09-02T00:00:00.000Z");

    await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-1`,
      title: "S",
      url: "https://e.com/s",
    });
    await Art.create({ artikul: btArt, prodName: prod, zone: "Z" });

    await SkuSlice.insertMany([
      {
        konkName: konk,
        date: d0,
        data: { [`${konk}-1`]: { stock: 13, price: 2 } },
      },
      {
        konkName: konk,
        date: d1,
        data: { [`${konk}-1`]: { stock: 10, price: 2 } },
      },
      {
        konkName: konk,
        date: d2,
        data: { [`${konk}-1`]: { stock: 7, price: 2 } },
      },
    ]);
    await SkuManufacturerDaySales.insertMany([
      {
        konkName: konk,
        date: d1,
        prodName: prod,
        salesPcs: 3,
        salesUah: 6,
      },
      {
        konkName: konk,
        date: d2,
        prodName: prod,
        salesPcs: 3,
        salesUah: 6,
      },
    ]);
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: prod.toLowerCase(), salesPcs: 5, salesUah: 50 },
      { date: d2, prodName: prod.toLowerCase(), salesPcs: 5, salesUah: 50 },
    ]);
    await BtradeSlice.insertMany([
      {
        date: d0,
        data: { [btArt]: { quantity: 45, price: 10 } },
      },
      {
        date: d1,
        data: { [btArt]: { quantity: 40, price: 10 } },
      },
      {
        date: d2,
        data: { [btArt]: { quantity: 35, price: 10 } },
      },
    ]);

    const result = await loadKonkProdSkuChartSeries({
      konk,
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dayCount).toBe(2);
    expect(result.competitorSales).toEqual([3, 3]);
    expect(result.competitorRevenue).toEqual([6, 6]);
    expect(result.competitorStock).toEqual([10, 7]);
    expect(result.btradeStock[0]).toBe(40);
    expect(result.btradeStock[1]).toBe(35);
    expect(result.btradeSales[0]).toBe(5);
    expect(result.btradeSales[1]).toBe(5);
    expect(result.btradeRevenue[0]).toBe(50);
    expect(result.btradeRevenue[1]).toBe(50);
  });

  it("with prod=all sums rollup manufacturers for sales", async () => {
    const konk = "core-all";
    const d1 = new Date("2026-09-10T00:00:00.000Z");

    await Sku.insertMany([
      {
        konkName: konk,
        prodName: "A",
        productId: `${konk}-a`,
        title: "A",
        url: "https://e.com/a",
      },
      {
        konkName: konk,
        prodName: "B",
        productId: `${konk}-b`,
        title: "B",
        url: "https://e.com/b",
      },
    ]);
    await SkuSlice.create({
      konkName: konk,
      date: d1,
      data: {
        [`${konk}-a`]: { stock: 5, price: 1 },
        [`${konk}-b`]: { stock: 8, price: 1 },
      },
    });
    await SkuManufacturerDaySales.insertMany([
      { konkName: konk, date: d1, prodName: "A", salesPcs: 2, salesUah: 2 },
      { konkName: konk, date: d1, prodName: "B", salesPcs: 4, salesUah: 4 },
    ]);

    const result = await loadKonkProdSkuChartSeries({
      konk,
      prod: "all",
      dateFrom: d1,
      dateTo: d1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.competitorSales).toEqual([6]);
    expect(result.competitorRevenue).toEqual([6]);
    expect(result.competitorStock).toEqual([13]);
  });
});
