import { beforeEach, describe, expect, it } from "vitest";
import type { ISkuSliceDataItem } from "../../../sku-slices/models/skuSliceTypes.js";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import {
  buildSliceMapsByKonk,
  getSliceItem,
  loadSkugrsWithSkuRefsForKonkProd,
} from "../skugrReporting.js";

describe("skugrReporting slice maps", () => {
  it("getSliceItem reads konk, date and productId", () => {
    const d = new Date("2026-01-05T00:00:00.000Z");
    const maps = buildSliceMapsByKonk([
      {
        konkName: "k1",
        date: d,
        data: { pid1: { stock: 1, price: 2 } satisfies ISkuSliceDataItem },
      },
    ]);
    const item = getSliceItem(maps, "k1", "pid1", d);
    expect(item).toEqual({ stock: 1, price: 2 });
    expect(getSliceItem(maps, "k1", "missing", d)).toBeUndefined();
    expect(getSliceItem(maps, "k2", "pid1", d)).toBeUndefined();
  });

  it("keeps separate maps per konkName", () => {
    const d = new Date("2026-02-01T00:00:00.000Z");
    const maps = buildSliceMapsByKonk([
      {
        konkName: "a",
        date: d,
        data: { p: { stock: 1, price: 1 } },
      },
      {
        konkName: "b",
        date: d,
        data: { p: { stock: 2, price: 2 } },
      },
    ]);
    expect(getSliceItem(maps, "a", "p", d)?.stock).toBe(1);
    expect(getSliceItem(maps, "b", "p", d)?.stock).toBe(2);
  });
});

describe("loadSkugrsWithSkuRefsForKonkProd", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns empty array when no skugr for konk/prod", async () => {
    const rows = await loadSkugrsWithSkuRefsForKonkProd("no-k", "no-p");
    expect(rows).toEqual([]);
  });

  it("batches skugrs sorted by title with ordered sku refs", async () => {
    const konk = "batch-k";
    const prod = "batch-p";
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
    const skuEmptyPid = await Sku.create({
      konkName: konk,
      prodName: prod,
      productId: "   ",
      title: "Empty",
      url: "https://e.com/e",
    });

    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Zebra",
      url: "https://e.com/z",
      isSliced: true,
      skus: [skuB._id, skuA._id, skuEmptyPid._id],
    });
    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Alpha",
      url: "https://e.com/a",
      isSliced: true,
      skus: [skuA._id],
    });
    await Skugr.create({
      konkName: konk,
      prodName: prod,
      title: "Empty group",
      url: "https://e.com/empty",
      isSliced: true,
      skus: [],
    });

    const rows = await loadSkugrsWithSkuRefsForKonkProd(konk, prod);
    expect(rows.map((r) => r.title)).toEqual(["Alpha", "Empty group", "Zebra"]);
    expect(rows[0]!.skus).toEqual([{ konkName: konk, productId: `${konk}-a` }]);
    expect(rows[1]!.skus).toEqual([]);
    expect(rows[2]!.skus).toEqual([
      { konkName: konk, productId: `${konk}-b` },
      { konkName: konk, productId: `${konk}-a` },
    ]);
  });
});
