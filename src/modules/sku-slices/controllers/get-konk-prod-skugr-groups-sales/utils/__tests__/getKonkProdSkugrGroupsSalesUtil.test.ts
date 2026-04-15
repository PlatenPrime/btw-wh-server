import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkProdSkugrGroupsSalesUtil } from "../getKonkProdSkugrGroupsSalesUtil.js";

describe("getKonkProdSkugrGroupsSalesUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns ok false when no skugr for konk/prod", async () => {
    const result = await getKonkProdSkugrGroupsSalesUtil({
      konk: "missing-konk",
      prod: "missing-prod",
      dateFrom: new Date("2026-08-01T00:00:00.000Z"),
      dateTo: new Date("2026-08-02T00:00:00.000Z"),
    });
    expect(result.ok).toBe(false);
  });

  it("returns zeros when skugr has no skus with productId (empty skus list)", async () => {
    await Skugr.create({
      konkName: "ggs-k",
      prodName: "ggs-p",
      title: "Empty skus group",
      url: "https://e.com/g",
      isSliced: true,
      skus: [],
    });

    const result = await getKonkProdSkugrGroupsSalesUtil({
      konk: "ggs-k",
      prod: "ggs-p",
      dateFrom: new Date("2026-08-10T00:00:00.000Z"),
      dateTo: new Date("2026-08-10T00:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      title: "Empty skus group",
      salesPcs: 0,
      salesUah: 0,
    });
    expect(result.all).toEqual({
      title: "Всі групи",
      salesPcs: 0,
      salesUah: 0,
    });
  });

  it("aggregates two skugrs sorted by title with independent sales", async () => {
    const konk = "ggs-konk-2";
    const prod = "ggs-prod-2";
    const d0 = new Date("2026-09-01T00:00:00.000Z");
    const d1 = new Date("2026-09-02T00:00:00.000Z");
    const d2 = new Date("2026-09-03T00:00:00.000Z");

    const skuA = await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-a`,
      title: "A",
      url: "https://e.com/a",
    });
    const skuB = await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-b`,
      title: "B",
      url: "https://e.com/b",
    });

    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Zebra group",
      url: "https://e.com/gz",
      isSliced: true,
      skus: [skuA._id],
    });
    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Alpha group",
      url: "https://e.com/ga",
      isSliced: true,
      skus: [skuB._id],
    });

    await SkuSlice.insertMany([
      {
        konkName: konk,
        date: d0,
        data: {
          [`${konk}-a`]: { stock: 10, price: 5 },
          [`${konk}-b`]: { stock: 20, price: 2 },
        },
      },
      {
        konkName: konk,
        date: d1,
        data: {
          [`${konk}-a`]: { stock: 7, price: 5 },
          [`${konk}-b`]: { stock: 18, price: 2 },
        },
      },
      {
        konkName: konk,
        date: d2,
        data: {
          [`${konk}-a`]: { stock: 5, price: 5 },
          [`${konk}-b`]: { stock: 15, price: 2 },
        },
      },
    ]);

    const result = await getKonkProdSkugrGroupsSalesUtil({
      konk,
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.map((r) => r.title)).toEqual(["Alpha group", "Zebra group"]);

    const alpha = result.data.find((r) => r.title === "Alpha group");
    const zebra = result.data.find((r) => r.title === "Zebra group");
    expect(alpha).toMatchObject({
      salesPcs: 5,
      salesUah: 10,
    });
    expect(zebra).toMatchObject({
      salesPcs: 5,
      salesUah: 25,
    });
    expect(result.all).toEqual({
      title: "Всі групи",
      salesPcs: 10,
      salesUah: 35,
    });
  });

  it("calculates all from full konk/prod sku base without skugr duplication", async () => {
    const konk = "ggs-konk-overlap";
    const prod = "ggs-prod-overlap";
    const d0 = new Date("2026-10-01T00:00:00.000Z");
    const d1 = new Date("2026-10-02T00:00:00.000Z");
    const d2 = new Date("2026-10-03T00:00:00.000Z");

    const skuShared = await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-shared`,
      title: "Shared",
      url: "https://e.com/shared",
    });
    const skuA = await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-a`,
      title: "A",
      url: "https://e.com/a",
    });
    const skuOnlyInAll = await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: `${konk}-all-only`,
      title: "All only",
      url: "https://e.com/all-only",
    });
    await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: ` ${konk}-all-only `,
      title: "All only duplicate",
      url: "https://e.com/all-only-dup",
    });

    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Group A",
      url: "https://e.com/group-a",
      isSliced: true,
      skus: [skuShared._id, skuA._id],
    });
    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Group B",
      url: "https://e.com/group-b",
      isSliced: true,
      skus: [skuShared._id],
    });

    await SkuSlice.insertMany([
      {
        konkName: konk,
        date: d0,
        data: {
          [`${konk}-shared`]: { stock: 20, price: 3 },
          [`${konk}-a`]: { stock: 10, price: 2 },
          [`${konk}-all-only`]: { stock: 8, price: 4 },
        },
      },
      {
        konkName: konk,
        date: d1,
        data: {
          [`${konk}-shared`]: { stock: 15, price: 3 },
          [`${konk}-a`]: { stock: 8, price: 2 },
          [`${konk}-all-only`]: { stock: 6, price: 4 },
        },
      },
      {
        konkName: konk,
        date: d2,
        data: {
          [`${konk}-shared`]: { stock: 10, price: 3 },
          [`${konk}-a`]: { stock: 7, price: 2 },
          [`${konk}-all-only`]: { stock: 5, price: 4 },
        },
      },
    ]);

    const result = await getKonkProdSkugrGroupsSalesUtil({
      konk,
      prod,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const groupA = result.data.find((row) => row.title === "Group A");
    const groupB = result.data.find((row) => row.title === "Group B");
    expect(groupA).toMatchObject({ salesPcs: 13, salesUah: 36 });
    expect(groupB).toMatchObject({ salesPcs: 10, salesUah: 30 });

    // all = unique sku base for konk/prod: shared + a + all-only (without duplication from groups/sku docs)
    expect(result.all).toEqual({
      title: "Всі групи",
      salesPcs: 16,
      salesUah: 48,
    });

    const groupsSumPcs = result.data.reduce((acc, row) => acc + row.salesPcs, 0);
    expect(groupsSumPcs).toBe(23);
    expect(result.all.salesPcs).not.toBe(groupsSumPcs);

    expect(skuOnlyInAll.productId).toBe(`${konk}-all-only`);
  });
});
