import { seedSkuSliceMonthDay } from "../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../sku-slices/models/SkuSliceMonth.js";
﻿import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { BtradeSliceMonth } from "../../../btrade-slices/models/BtradeSliceMonth.js";
import { seedBtradeSliceMonthDay } from "../../../btrade-slices/utils/seedBtradeSliceMonthDay.js";
import { Sku } from "../../../skus/models/Sku.js";
import { SkuManufacturerDaySales } from "../../models/SkuManufacturerDaySales.js";
import { BtradeManufacturerDaySales } from "../../models/BtradeManufacturerDaySales.js";
import { loadKonkProdSkuChartSeries } from "../konkProdSkuChartCore.js";

describe("loadKonkProdSkuChartSeries", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSliceMonth.deleteMany({});
    await BtradeSliceMonth.deleteMany({});
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

    await seedSkuSliceMonthDay(konk, d0, { [`${konk}-1`]: { stock: 13, price: 2 } });
    await seedSkuSliceMonthDay(konk, d1, { [`${konk}-1`]: { stock: 10, price: 2 } });
    await seedSkuSliceMonthDay(konk, d2, { [`${konk}-1`]: { stock: 7, price: 2 } });
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
    await seedBtradeSliceMonthDay(d0, {
      [btArt]: { quantity: 45, price: 10 },
    });
    await seedBtradeSliceMonthDay(d1, {
      [btArt]: { quantity: 40, price: 10 },
    });
    await seedBtradeSliceMonthDay(d2, {
      [btArt]: { quantity: 35, price: 10 },
    });

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
    await seedSkuSliceMonthDay(konk, d1, {
        [`${konk}-a`]: { stock: 5, price: 1 },
        [`${konk}-b`]: { stock: 8, price: 1 },
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
