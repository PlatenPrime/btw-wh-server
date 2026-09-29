import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { patchSkuSliceByDateUtil } from "../patchSkuSliceByDateUtil.js";

describe("patchSkuSliceByDateUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("overwrites existing point and returns previous", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-9710",
      title: "Napkins",
      url: "https://perfect.example/9710",
    });
    const date = new Date("2026-09-20T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "perfect",
      date,
      data: { "perfect-9710": { stock: 60, price: 5.5 } },
    });

    const result = await patchSkuSliceByDateUtil({
      skuId: sku._id.toString(),
      date,
      stock: 3,
      price: 110,
    });

    expect(result).toEqual({
      productId: "perfect-9710",
      date,
      stock: 3,
      price: 110,
      previous: { stock: 60, price: 5.5 },
      created: false,
    });

    const stored = await SkuSlice.findOne({
      konkName: "perfect",
      date,
    }).lean();
    expect(stored?.data["perfect-9710"]).toEqual({ stock: 3, price: 110 });
  });

  it("creates missing productId key when slice document exists", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-1",
      title: "T",
      url: "https://perfect.example/1",
    });
    const date = new Date("2026-09-20T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "perfect",
      date,
      data: { "perfect-other": { stock: 1, price: 2 } },
    });

    const result = await patchSkuSliceByDateUtil({
      skuId: sku._id.toString(),
      date,
      stock: 0,
      price: -1,
    });

    expect(result?.previous).toBeNull();
    expect(result?.created).toBe(false);
    expect(result?.stock).toBe(0);
    expect(result?.price).toBe(-1);

    const stored = await SkuSlice.findOne({
      konkName: "perfect",
      date,
    }).lean();
    expect(stored?.data["perfect-1"]).toEqual({ stock: 0, price: -1 });
    expect(stored?.data["perfect-other"]).toEqual({ stock: 1, price: 2 });
  });

  it("upserts slice document when missing for date", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-1",
      title: "T",
      url: "https://perfect.example/1",
    });

    const date = new Date("2026-09-20T00:00:00.000Z");
    const result = await patchSkuSliceByDateUtil({
      skuId: sku._id.toString(),
      date,
      stock: 1,
      price: 2,
    });

    expect(result).toEqual({
      productId: "perfect-1",
      date,
      stock: 1,
      price: 2,
      previous: null,
      created: true,
    });

    const stored = await SkuSlice.findOne({
      konkName: "perfect",
      date,
    }).lean();
    expect(stored?.data["perfect-1"]).toEqual({ stock: 1, price: 2 });
  });

  it("returns null when sku is missing", async () => {
    const result = await patchSkuSliceByDateUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      date: new Date("2026-09-20T00:00:00.000Z"),
      stock: 1,
      price: 2,
    });
    expect(result).toBeNull();
  });
});
