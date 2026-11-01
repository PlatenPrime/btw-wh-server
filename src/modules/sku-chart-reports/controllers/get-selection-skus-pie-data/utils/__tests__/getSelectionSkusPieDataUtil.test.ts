import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSliceMonth } from "../../../../../sku-slices/models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../../../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { getSelectionSkusPieDataUtil } from "../getSelectionSkusPieDataUtil.js";

describe("getSelectionSkusPieDataUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Konk.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("returns ok:false when none of skuIds exist", async () => {
    const result = await getSelectionSkusPieDataUtil({
      skuIds: ["507f1f77bcf86cd799439011"],
      dateFrom: new Date("2026-04-02T00:00:00.000Z"),
      dateTo: new Date("2026-04-03T00:00:00.000Z"),
    });
    expect(result).toEqual({ ok: false });
  });

  it("returns per-sku shares across competitors", async () => {
    const d0 = new Date("2026-04-01T00:00:00.000Z");
    const d1 = new Date("2026-04-02T00:00:00.000Z");
    const d2 = new Date("2026-04-03T00:00:00.000Z");

    const air = await Sku.create({
      konkName: "air",
      prodName: "g",
      productId: "air-p",
      title: "Air item",
      url: "https://e.com/air-p",
    });
    const balun = await Sku.create({
      konkName: "balun",
      prodName: "g",
      productId: "balun-p",
      title: "Balun item",
      url: "https://e.com/balun-p",
    });

    await seedSkuSliceMonthDay("air", d0, { "air-p": { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay("air", d1, { "air-p": { stock: 7, price: 5 } });
    await seedSkuSliceMonthDay("air", d2, { "air-p": { stock: 5, price: 5 } });
    await seedSkuSliceMonthDay("balun", d0, { "balun-p": { stock: 20, price: 10 } });
    await seedSkuSliceMonthDay("balun", d1, { "balun-p": { stock: 18, price: 10 } });
    await seedSkuSliceMonthDay("balun", d2, { "balun-p": { stock: 15, price: 10 } });

    const result = await getSelectionSkusPieDataUtil({
      skuIds: [air._id.toString(), balun._id.toString()],
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // air: 3+2=5 pcs / 25 uah; balun: 2+3=5 pcs / 50 uah
    expect(result.all).toEqual({
      title: "Всі обрані",
      salesPcs: 10,
      salesUah: 75,
    });
    expect(result.data[air._id.toString()]).toMatchObject({
      title: "Air item",
      konkName: "air",
      productId: "air-p",
      salesPcs: 5,
      salesUah: 25,
      sharePcs: 50,
      shareUah: 33.33,
    });
    expect(result.data[balun._id.toString()]).toMatchObject({
      salesPcs: 5,
      salesUah: 50,
      sharePcs: 50,
      shareUah: 66.67,
    });
  });
});
