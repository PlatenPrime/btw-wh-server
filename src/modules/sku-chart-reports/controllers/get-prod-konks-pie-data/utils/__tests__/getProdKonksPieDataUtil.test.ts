import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { Konk } from "../../../../../konks/models/Konk.js";
import { SkuManufacturerDaySales } from "../../../../../sku-reporting/models/SkuManufacturerDaySales.js";
import { BtradeManufacturerDaySales } from "../../../../../sku-reporting/models/BtradeManufacturerDaySales.js";
import { getProdKonksPieDataUtil } from "../getProdKonksPieDataUtil.js";

describe("getProdKonksPieDataUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
    await Art.deleteMany({});
    await SkuManufacturerDaySales.deleteMany({});
    await BtradeManufacturerDaySales.deleteMany({});
  });

  it("returns ok false when no sku and no arts", async () => {
    const result = await getProdKonksPieDataUtil({
      prod: "no-prod",
      dateFrom: new Date("2026-11-01T00:00:00.000Z"),
      dateTo: new Date("2026-11-02T00:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
  });

  it("aggregates multiple konks for one prod and includes btrade in all", async () => {
    const prod = "SharedProd";
    const k1 = "pie-k1";
    const k2 = "pie-k2";
    const btArt = "PIE-BT-1";
    const d1 = new Date("2026-11-10T00:00:00.000Z");
    const d2 = new Date("2026-11-11T00:00:00.000Z");

    await Konk.insertMany([
      {
        name: k1,
        title: "Konk One",
        url: "https://e.com/k1",
        imageUrl: "https://e.com/k1.png",
        recountDays: [],
      },
      {
        name: k2,
        title: "Konk Two",
        url: "https://e.com/k2",
        imageUrl: "https://e.com/k2.png",
        recountDays: [],
      },
    ]);

    await Art.create({ artikul: btArt, prodName: prod, zone: "Z" });

    await SkuManufacturerDaySales.insertMany([
      { konkName: k1, date: d1, prodName: prod, salesPcs: 2, salesUah: 20 },
      { konkName: k1, date: d2, prodName: prod, salesPcs: 1, salesUah: 10 },
      { konkName: k2, date: d1, prodName: prod, salesPcs: 1, salesUah: 20 },
      { konkName: k2, date: d2, prodName: prod, salesPcs: 2, salesUah: 40 },
    ]);
    await BtradeManufacturerDaySales.insertMany([
      { date: d1, prodName: prod.toLowerCase(), salesPcs: 5, salesUah: 50 },
      { date: d2, prodName: prod.toLowerCase(), salesPcs: 5, salesUah: 50 },
    ]);

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data[k1]).toEqual({
      title: "Konk One",
      salesPcs: 3,
      salesUah: 30,
    });
    expect(result.data[k2]).toEqual({
      title: "Konk Two",
      salesPcs: 3,
      salesUah: 60,
    });
    expect(result.data.btrade).toEqual({
      title: "Btrade",
      salesPcs: 10,
      salesUah: 100,
    });
    expect(result.all).toEqual({
      title: "Всі конкуренти",
      salesPcs: 16,
      salesUah: 190,
    });
  });

  it("returns only btrade when no competitor skus", async () => {
    const prod = "OnlyBt";
    const btArt = "ONLY-BT";
    const d1 = new Date("2026-11-10T00:00:00.000Z");

    await Art.create({ artikul: btArt, prodName: prod, zone: "Z" });
    await BtradeManufacturerDaySales.create({
      date: d1,
      prodName: prod.toLowerCase(),
      salesPcs: 5,
      salesUah: 25,
    });

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.data)).toEqual(["btrade"]);
    expect(result.data.btrade).toEqual({
      title: "Btrade",
      salesPcs: 5,
      salesUah: 25,
    });
    expect(result.all.salesPcs).toBe(5);
  });

  it("excludes konk from data and all", async () => {
    const prod = "ExProd";
    const k1 = "ex-k1";
    const k2 = "ex-k2";
    const d1 = new Date("2026-11-10T00:00:00.000Z");

    await Konk.insertMany([
      {
        name: k1,
        title: "K1",
        url: "https://e.com/k1",
        imageUrl: "https://e.com/k1.png",
        recountDays: [],
      },
      {
        name: k2,
        title: "K2",
        url: "https://e.com/k2",
        imageUrl: "https://e.com/k2.png",
        recountDays: [],
      },
    ]);
    await Art.create({ artikul: "EX-BT", prodName: prod, zone: "Z" });
    await SkuManufacturerDaySales.insertMany([
      { konkName: k1, date: d1, prodName: prod, salesPcs: 2, salesUah: 20 },
      { konkName: k2, date: d1, prodName: prod, salesPcs: 5, salesUah: 50 },
    ]);
    await BtradeManufacturerDaySales.create({
      date: d1,
      prodName: prod.toLowerCase(),
      salesPcs: 3,
      salesUah: 30,
    });

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d1,
      excludeKonks: [k2],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[k1]).toEqual({ title: "K1", salesPcs: 2, salesUah: 20 });
    expect(result.data[k2]).toBeUndefined();
    expect(result.data.btrade).toEqual({
      title: "Btrade",
      salesPcs: 3,
      salesUah: 30,
    });
    expect(result.all).toEqual({
      title: "Всі конкуренти",
      salesPcs: 5,
      salesUah: 50,
    });
  });

  it("excludes btrade when listed in excludeKonks", async () => {
    const prod = "NoBtProd";
    const k1 = "nobt-k1";
    const d1 = new Date("2026-11-10T00:00:00.000Z");

    await Konk.create({
      name: k1,
      title: "K1",
      url: "https://e.com/k1",
      imageUrl: "https://e.com/k1.png",
      recountDays: [],
    });
    await Art.create({ artikul: "NOBT-ART", prodName: prod, zone: "Z" });
    await SkuManufacturerDaySales.create({
      konkName: k1,
      date: d1,
      prodName: prod,
      salesPcs: 4,
      salesUah: 40,
    });
    await BtradeManufacturerDaySales.create({
      date: d1,
      prodName: prod.toLowerCase(),
      salesPcs: 9,
      salesUah: 90,
    });

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d1,
      excludeKonks: ["btrade"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[k1]).toEqual({ title: "K1", salesPcs: 4, salesUah: 40 });
    expect(result.data.btrade).toBeUndefined();
    expect(result.all.salesPcs).toBe(4);
    expect(result.all.salesUah).toBe(40);
  });

  it("reads recount-baked rollup totals per konk", async () => {
    const prod = "RecProd";
    const konk = "pie-rec-k";
    await Konk.create({
      name: konk,
      title: "Rec Konk",
      url: "https://e.com/k",
      imageUrl: "https://e.com/k.png",
      recountDays: ["2026-12-22"],
    });
    const d1 = new Date("2026-12-22T00:00:00.000Z");
    const d2 = new Date("2026-12-23T00:00:00.000Z");

    await SkuManufacturerDaySales.insertMany([
      { konkName: konk, date: d1, prodName: prod, salesPcs: 0, salesUah: 0 },
      { konkName: konk, date: d2, prodName: prod, salesPcs: 3, salesUah: 15 },
    ]);

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[konk]).toEqual({
      title: "Rec Konk",
      salesPcs: 3,
      salesUah: 15,
    });
  });
});
