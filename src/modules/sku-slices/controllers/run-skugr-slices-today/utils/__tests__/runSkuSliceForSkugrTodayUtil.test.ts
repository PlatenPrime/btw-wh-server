import { beforeEach, describe, expect, it, vi } from "vitest";
import { toSliceDate } from "../../../../../../utils/sliceDate.js";

vi.mock("../../../../../skus/utils/getSkuStockDataUtil.js", () => ({
  getSkuStockDataUtil: vi.fn(),
  UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
vi.mock("../../../../../../utils/delay.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../../../../utils/jitterMs.js", () => ({
  jitterMs: vi.fn((min: number) => min),
}));

import { getSkuStockDataUtil } from "../../../../../skus/utils/getSkuStockDataUtil.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { runSkuSliceForSkugrTodayUtil } from "../runSkuSliceForSkugrTodayUtil.js";

describe("runSkuSliceForSkugrTodayUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
    vi.mocked(getSkuStockDataUtil).mockReset();
  });

  it("returns null when skugr missing", async () => {
    const result = await runSkuSliceForSkugrTodayUtil({
      skugrId: "507f1f77bcf86cd799439011",
    });
    expect(result).toBeNull();
  });

  it("returns zeros for empty skus list", async () => {
    const skugr = await Skugr.create({
      konkName: "perfect",
      prodName: "pd",
      title: "Empty",
      url: "https://e.com/g",
      skus: [],
    });

    const result = await runSkuSliceForSkugrTodayUtil({
      skugrId: skugr._id.toString(),
    });

    expect(result).toMatchObject({
      skugrId: skugr._id.toString(),
      konkName: "perfect",
      total: 0,
      count: 0,
      invalid: 0,
      errors: 0,
    });
    expect(result!.sliceDate).toEqual(toSliceDate(new Date()));

    const slice = await SkuSlice.findOne({
      konkName: "perfect",
      date: result!.sliceDate,
    }).lean();
    expect(slice).not.toBeNull();
  });

  it("scrapes and overwrites existing points", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-ow",
      title: "T",
      url: "https://e.com/1",
    });
    const skugr = await Skugr.create({
      konkName: "perfect",
      prodName: "pd",
      title: "G",
      url: "https://e.com/g",
      skus: [sku._id],
    });
    const today = toSliceDate(new Date());
    await SkuSlice.create({
      konkName: "perfect",
      date: today,
      data: { "perfect-ow": { stock: 1, price: 2 } },
    });

    vi.mocked(getSkuStockDataUtil).mockResolvedValue({
      stock: 10,
      price: 99,
    });

    const result = await runSkuSliceForSkugrTodayUtil({
      skugrId: skugr._id.toString(),
    });

    expect(result).toMatchObject({
      total: 1,
      count: 1,
      invalid: 0,
      errors: 0,
    });
    expect(getSkuStockDataUtil).toHaveBeenCalledWith(sku._id.toString());

    const stored = await SkuSlice.findOne({
      konkName: "perfect",
      date: today,
    }).lean();
    expect(stored?.data["perfect-ow"]).toEqual({ stock: 10, price: 99 });
  });

  it("counts invalid when stock is -1", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-inv",
      title: "T",
      url: "https://e.com/1",
    });
    const skugr = await Skugr.create({
      konkName: "perfect",
      prodName: "pd",
      title: "G",
      url: "https://e.com/g",
      skus: [sku._id],
    });

    vi.mocked(getSkuStockDataUtil).mockResolvedValue({
      stock: -1,
      price: -1,
    });

    const result = await runSkuSliceForSkugrTodayUtil({
      skugrId: skugr._id.toString(),
    });

    expect(result).toMatchObject({
      total: 1,
      count: 0,
      invalid: 1,
      errors: 0,
    });

    const stored = await SkuSlice.findOne({
      konkName: "perfect",
      date: result!.sliceDate,
    }).lean();
    expect(stored?.data["perfect-inv"]).toEqual({ stock: -1, price: -1 });
  });

  it("counts sku without productId as invalid", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "   ",
      title: "T",
      url: "https://e.com/1",
    });
    const skugr = await Skugr.create({
      konkName: "perfect",
      prodName: "pd",
      title: "G",
      url: "https://e.com/g",
      skus: [sku._id],
    });

    const result = await runSkuSliceForSkugrTodayUtil({
      skugrId: skugr._id.toString(),
    });

    expect(result).toMatchObject({
      total: 1,
      count: 0,
      invalid: 1,
      errors: 0,
    });
    expect(getSkuStockDataUtil).not.toHaveBeenCalled();
  });
});
