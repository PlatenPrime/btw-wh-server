import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSliceMonth } from "../../../models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../../../utils/seedSkuSliceMonthDay.js";
import { getSkuSliceByDateUtil } from "../utils/getSkuSliceByDateUtil.js";

describe("getSkuSliceByDateUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("returns stock and price when sku and slice exist", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-99",
      title: "T",
      url: "https://example.com/p1",
    });
    const date = new Date("2026-03-01T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", date, {
      "air-99": { stock: 3, price: 12.5 },
    });

    const result = await getSkuSliceByDateUtil({
      skuId: sku._id.toString(),
      date,
    });
    expect(result).toEqual({ stock: 3, price: 12.5 });
  });

  it("returns null when sku not found", async () => {
    const result = await getSkuSliceByDateUtil({
      skuId: "69a2de17f8a2a9cb9a8a75df",
      date: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(result).toBeNull();
  });

  it("returns null when slice has no entry for productId", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-99",
      title: "T",
      url: "https://example.com/p2",
    });
    const date = new Date("2026-03-01T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", date, {
      "other-key": { stock: 1, price: 2 },
    });
    expect(
      await getSkuSliceByDateUtil({ skuId: sku._id.toString(), date }),
    ).toBeNull();
  });
});
