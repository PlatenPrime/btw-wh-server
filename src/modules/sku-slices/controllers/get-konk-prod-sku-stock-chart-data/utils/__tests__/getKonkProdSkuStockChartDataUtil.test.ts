import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkProdSkuStockChartDataUtil } from "../getKonkProdSkuStockChartDataUtil.js";

describe("getKonkProdSkuStockChartDataUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
    await BtradeSlice.deleteMany({});
    await Art.deleteMany({});
  });

  it("returns ok false when no skus for konk/prod", async () => {
    const r = await getKonkProdSkuStockChartDataUtil({
      konk: "nx",
      prod: "np",
      dateFrom: new Date("2026-08-01T00:00:00.000Z"),
      dateTo: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("returns ok false when prod=all but no skus for konk", async () => {
    const r = await getKonkProdSkuStockChartDataUtil({
      konk: "empty-konk",
      prod: "all",
      dateFrom: new Date("2026-08-15T00:00:00.000Z"),
      dateTo: new Date("2026-08-15T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("prod=all sums all skus for konk and all Art artikuls; single prod is a subset", async () => {
    const konk = "all-ch-k";
    const prodP1 = "all-ch-p1";
    const prodP2 = "all-ch-p2";
    const bt1 = "ALL-CH-BT-1";
    const bt2 = "ALL-CH-BT-2";

    await Sku.insertMany([
      {
        konkName: konk,
        prodName: prodP1,
        productId: `${konk}-red`,
        title: "R",
        url: "https://e.com/r",
      },
      {
        konkName: konk,
        prodName: prodP2,
        productId: `${konk}-blue`,
        title: "B",
        url: "https://e.com/b",
      },
    ]);

    await Art.insertMany([
      { artikul: bt1, prodName: prodP1, zone: "Z1" },
      { artikul: bt2, prodName: prodP2, zone: "Z2" },
    ]);

    const d1 = new Date("2026-10-01T00:00:00.000Z");
    const d2 = new Date("2026-10-02T00:00:00.000Z");

    await SkuSlice.insertMany([
      {
        konkName: konk,
        date: d1,
        data: {
          [`${konk}-red`]: { stock: 10, price: 2 },
          [`${konk}-blue`]: { stock: 5, price: 3 },
        },
      },
      {
        konkName: konk,
        date: d2,
        data: {
          [`${konk}-red`]: { stock: 8, price: 2 },
          [`${konk}-blue`]: { stock: 4, price: 3 },
        },
      },
    ]);

    await BtradeSlice.insertMany([
      {
        date: d1,
        data: {
          [bt1]: { quantity: 100, price: 5 },
          [bt2]: { quantity: 50, price: 6 },
        },
      },
      {
        date: d2,
        data: {
          [bt1]: { quantity: 90, price: 5 },
          [bt2]: { quantity: 45, price: 6 },
        },
      },
    ]);

    const oneProd = await getKonkProdSkuStockChartDataUtil({
      konk,
      prod: prodP1,
      dateFrom: d1,
      dateTo: d2,
    });
    expect(oneProd.ok).toBe(true);
    if (!oneProd.ok) return;
    expect(oneProd.data.days[0]).toMatchObject({
      competitorStock: 10,
      btradeStock: 100,
    });
    expect(oneProd.data.days[1]).toMatchObject({
      competitorStock: 8,
      btradeStock: 90,
    });

    const allProd = await getKonkProdSkuStockChartDataUtil({
      konk,
      prod: "all",
      dateFrom: d1,
      dateTo: d2,
    });
    expect(allProd.ok).toBe(true);
    if (!allProd.ok) return;
    expect(allProd.data.days[0]).toMatchObject({
      competitorStock: 15,
      btradeStock: 150,
    });
    expect(allProd.data.days[1]).toMatchObject({
      competitorStock: 12,
      btradeStock: 135,
    });
  });

  it("sums competitor sku stock and btrade quantities for all Art artikuls with prodName", async () => {
    const konk = "kp-k";
    const prod = "kp-p";
    const bt1 = "KP-BT-001";
    const bt2 = "KP-BT-002";

    await Sku.insertMany([
      {
        konkName: konk,
        prodName: prod,
        productId: `${konk}-x`,
        title: "A",
        url: "https://e.com/kp-a",
      },
      {
        konkName: konk,
        prodName: prod,
        productId: `${konk}-y`,
        title: "B",
        url: "https://e.com/kp-b",
      },
    ]);

    await Art.insertMany([
      { artikul: bt1, prodName: prod, zone: "Z1" },
      { artikul: bt2, prodName: prod, zone: "Z2" },
    ]);

    const d1 = new Date("2026-08-10T00:00:00.000Z");
    const d2 = new Date("2026-08-11T00:00:00.000Z");

    await SkuSlice.insertMany([
      {
        konkName: konk,
        date: d1,
        data: {
          [`${konk}-x`]: { stock: 10, price: 2 },
          [`${konk}-y`]: { stock: 20, price: 3 },
        },
      },
      {
        konkName: konk,
        date: d2,
        data: {
          [`${konk}-x`]: { stock: 8, price: 2 },
          [`${konk}-y`]: { stock: 15, price: 3 },
        },
      },
    ]);

    await BtradeSlice.insertMany([
      {
        date: d1,
        data: {
          [bt1]: { quantity: 100, price: 5 },
          [bt2]: { quantity: 30, price: 6 },
        },
      },
      {
        date: d2,
        data: {
          [bt1]: { quantity: 88, price: 5 },
          [bt2]: { quantity: 25, price: 6 },
        },
      },
    ]);

    const r = await getKonkProdSkuStockChartDataUtil({
      konk,
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.data.days).toHaveLength(2);
    expect(r.data.days[0]).toMatchObject({
      competitorStock: 30,
      btradeStock: 130,
    });
    expect(r.data.days[1]).toMatchObject({
      competitorStock: 23,
      btradeStock: 113,
    });
    expect(r.data.summary.firstDayCompetitorStock).toBe(30);
    expect(r.data.summary.lastDayBtradeStock).toBe(113);
  });

  it("btrade zero when BtradeSlice has artikul but no Art with matching prodName", async () => {
    const konk = "kp-k3";
    const prod = "kp-p3";
    const orphanBt = "KP-BT-ORPHAN";

    await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-z`,
      title: "Z",
      url: "https://e.com/kp-z",
    });

    const d1 = new Date("2026-08-21T00:00:00.000Z");
    await SkuSlice.create({
      konkName: konk,
      date: d1,
      data: { [`${konk}-z`]: { stock: 3, price: 1 } },
    });
    await BtradeSlice.create({
      date: d1,
      data: { [orphanBt]: { quantity: 42, price: 7 } },
    });

    const r = await getKonkProdSkuStockChartDataUtil({
      konk,
      prod,
      dateFrom: d1,
      dateTo: d1,
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.days[0]).toMatchObject({
      competitorStock: 3,
      btradeStock: 0,
    });
  });

  it("btrade series zero when Art.prodName does not match query prod", async () => {
    const konk = "kp-k2";
    const prod = "kp-p2";
    const bt = "KP-BT-002";

    await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-only`,
      title: "S",
      url: "https://e.com/kp-s",
    });

    await Art.create({
      artikul: bt,
      prodName: "other-prod",
      zone: "Z2",
    });

    const d1 = new Date("2026-08-20T00:00:00.000Z");
    await SkuSlice.create({
      konkName: konk,
      date: d1,
      data: { [`${konk}-only`]: { stock: 5, price: 1 } },
    });
    await BtradeSlice.create({
      date: d1,
      data: { [bt]: { quantity: 50, price: 9 } },
    });

    const r = await getKonkProdSkuStockChartDataUtil({
      konk,
      prod,
      dateFrom: d1,
      dateTo: d1,
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.days[0]).toMatchObject({
      competitorStock: 5,
      btradeStock: 0,
    });
  });
});
