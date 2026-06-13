import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { BtradeSlice } from "../../../btrade-slices/models/BtradeSlice.js";
import { Sku } from "../../../skus/models/Sku.js";
import { SkuSlice } from "../../../sku-slices/models/SkuSlice.js";
import { loadKonkProdSkuChartSeries } from "../konkProdSkuChartCore.js";

describe("loadKonkProdSkuChartSeries", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
    await BtradeSlice.deleteMany({});
    await Art.deleteMany({});
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

  it("loads competitor and btrade series for matching prod", async () => {
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
    expect(result.btradeStock[0]).toBe(40);
    expect(result.btradeStock[1]).toBe(35);
    expect(result.btradeSales[0]).toBe(5);
    expect(result.btradeSales[1]).toBe(5);
  });
});
