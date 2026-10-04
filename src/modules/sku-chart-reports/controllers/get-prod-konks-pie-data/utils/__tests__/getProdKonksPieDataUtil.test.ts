import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../../sku-slices/models/SkuSlice.js";
import { getProdKonksPieDataUtil } from "../getProdKonksPieDataUtil.js";

describe("getProdKonksPieDataUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
    await Art.deleteMany({});
    await Skugr.deleteMany({});
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
    await BtradeSlice.deleteMany({});
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
    const d0 = new Date("2026-11-09T00:00:00.000Z");
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

    await Sku.insertMany([
      {
        konkName: k1,
        prodName: prod,
        productId: `${k1}-a`,
        title: "A",
        url: "https://e.com/pie-a",
      },
      {
        konkName: k2,
        prodName: prod,
        productId: `${k2}-b`,
        title: "B",
        url: "https://e.com/pie-b",
      },
    ]);
    await Art.create({ artikul: btArt, prodName: prod, zone: "Z" });

    await SkuSlice.insertMany([
      {
        konkName: k1,
        date: d0,
        data: { [`${k1}-a`]: { stock: 12, price: 10 } },
      },
      {
        konkName: k1,
        date: d1,
        data: { [`${k1}-a`]: { stock: 10, price: 10 } },
      },
      {
        konkName: k1,
        date: d2,
        data: { [`${k1}-a`]: { stock: 9, price: 10 } },
      },
      {
        konkName: k2,
        date: d0,
        data: { [`${k2}-b`]: { stock: 8, price: 20 } },
      },
      {
        konkName: k2,
        date: d1,
        data: { [`${k2}-b`]: { stock: 7, price: 20 } },
      },
      {
        konkName: k2,
        date: d2,
        data: { [`${k2}-b`]: { stock: 5, price: 20 } },
      },
    ]);
    await BtradeSlice.insertMany([
      { date: d0, data: { [btArt]: { quantity: 45, price: 10 } } },
      { date: d1, data: { [btArt]: { quantity: 40, price: 10 } } },
      { date: d2, data: { [btArt]: { quantity: 35, price: 10 } } },
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
    const d0 = new Date("2026-11-09T00:00:00.000Z");
    const d1 = new Date("2026-11-10T00:00:00.000Z");

    await Art.create({ artikul: btArt, prodName: prod, zone: "Z" });
    await BtradeSlice.insertMany([
      { date: d0, data: { [btArt]: { quantity: 20, price: 5 } } },
      { date: d1, data: { [btArt]: { quantity: 15, price: 5 } } },
    ]);

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

  it("narrows skus by skugrIds", async () => {
    const prod = "GrpProd";
    const k1 = "grp-k1";
    const k2 = "grp-k2";
    const d0 = new Date("2026-11-19T00:00:00.000Z");
    const d1 = new Date("2026-11-20T00:00:00.000Z");

    await Konk.insertMany([
      {
        name: k1,
        title: "G1",
        url: "https://e.com/g1",
        imageUrl: "https://e.com/g1.png",
        recountDays: [],
      },
      {
        name: k2,
        title: "G2",
        url: "https://e.com/g2",
        imageUrl: "https://e.com/g2.png",
        recountDays: [],
      },
    ]);

    const [sku1, sku2] = await Sku.insertMany([
      {
        konkName: k1,
        prodName: prod,
        productId: `${k1}-a`,
        title: "A",
        url: "https://e.com/grp-a",
      },
      {
        konkName: k2,
        prodName: prod,
        productId: `${k2}-b`,
        title: "B",
        url: "https://e.com/grp-b",
      },
    ]);

    const skugr = await Skugr.create({
      konkName: k1,
      prodName: prod,
      title: "Only K1",
      url: "https://e.com/skugr",
      skus: [sku1!._id],
    });

    await SkuSlice.insertMany([
      {
        konkName: k1,
        date: d0,
        data: { [`${k1}-a`]: { stock: 10, price: 2 } },
      },
      {
        konkName: k1,
        date: d1,
        data: { [`${k1}-a`]: { stock: 8, price: 2 } },
      },
      {
        konkName: k2,
        date: d0,
        data: { [`${k2}-b`]: { stock: 10, price: 2 } },
      },
      {
        konkName: k2,
        date: d1,
        data: { [`${k2}-b`]: { stock: 1, price: 2 } },
      },
    ]);

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d1,
      skugrIds: [skugr._id.toString()],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data[k1]).toMatchObject({ salesPcs: 2, salesUah: 4 });
    expect(result.data[k2]).toBeUndefined();
    expect(result.data.btrade).toBeUndefined();
    void sku2;
  });

  it("applies recount days per konk", async () => {
    const prod = "RecProd";
    const konk = "pie-rec-k";
    await Konk.create({
      name: konk,
      title: "Rec Konk",
      url: "https://e.com/k",
      imageUrl: "https://e.com/k.png",
      recountDays: ["2026-12-22"],
    });
    const d0 = new Date("2026-12-21T00:00:00.000Z");
    const d1 = new Date("2026-12-22T00:00:00.000Z");
    const d2 = new Date("2026-12-23T00:00:00.000Z");

    await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-x`,
      title: "X",
      url: "https://e.com/rec-x",
    });
    await SkuSlice.insertMany([
      { konkName: konk, date: d0, data: { [`${konk}-x`]: { stock: 10, price: 5 } } },
      { konkName: konk, date: d1, data: { [`${konk}-x`]: { stock: 7, price: 5 } } },
      { konkName: konk, date: d2, data: { [`${konk}-x`]: { stock: 4, price: 5 } } },
    ]);

    const result = await getProdKonksPieDataUtil({
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // d1 recount => 0 sales, d2 => 3
    expect(result.data[konk]).toEqual({
      title: "Rec Konk",
      salesPcs: 3,
      salesUah: 15,
    });
  });
});
