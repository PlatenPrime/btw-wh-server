import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Konk } from "../../../konks/models/Konk.js";
import { Sku } from "../../../skus/models/Sku.js";
import { SkuSliceMonth } from "../../../sku-slices/models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuManufacturerDaySales } from "../../models/SkuManufacturerDaySales.js";
import {
  afterSkuSliceStockMutation,
  materializeSkuSliceSalesDateRange,
  materializeSkuSliceSalesForKonkDays,
} from "../materializeSkuSliceSalesUtil.js";

describe("materializeSkuSliceSalesUtil", () => {
  const konkName = "mat-sku-konk";
  const d0 = new Date("2026-06-01T00:00:00.000Z");
  const d1 = new Date("2026-06-02T00:00:00.000Z");
  const d2 = new Date("2026-06-03T00:00:00.000Z");
  const d3 = new Date("2026-06-04T00:00:00.000Z");

  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
    await SkuManufacturerDaySales.deleteMany({});
    await Sku.deleteMany({});
    await Konk.deleteMany({});
    await Konk.create({
      name: konkName,
      title: "Mat",
      url: "https://example.com",
      imageUrl: "https://example.com/m.png",
      recountDays: [],
    });
    await Sku.create({
      konkName,
      prodName: "MakerX",
      productId: "p1",
      title: "P1",
      url: "https://example.com/p1",
    });
  });

  it("writes manufacturer rollup for D and D+1 from months", async () => {
    await seedSkuSliceMonthDay(konkName, d0, { p1: { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d1, { p1: { stock: 7, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d2, { p1: { stock: 4, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d3, { p1: { stock: 3, price: 5 } });

    const result = await materializeSkuSliceSalesForKonkDays({
      konkName,
      dayD: d1,
      apply: true,
    });

    expect(result.daysTouched).toEqual(["2026-06-02", "2026-06-03"]);
    expect(result.rollupDocs).toBe(2);

    const rollups = await SkuManufacturerDaySales.find({ konkName })
      .sort({ date: 1 })
      .lean();
    expect(rollups).toHaveLength(2);
    expect(rollups[0]).toMatchObject({
      prodName: "MakerX",
      salesPcs: 3,
      salesUah: 15,
    });
    expect(rollups[1]).toMatchObject({
      prodName: "MakerX",
      salesPcs: 3,
      salesUah: 15,
    });
  });

  it("zeros rollup sales when stock is -1", async () => {
    await seedSkuSliceMonthDay(konkName, d0, { p1: { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d1, {
      p1: { stock: -1, price: -1 },
    });

    await afterSkuSliceStockMutation({ konkName, dayD: d1 });
    const row = await SkuManufacturerDaySales.findOne({
      konkName,
      date: d1,
      prodName: "MakerX",
    }).lean();
    expect(row).toMatchObject({ salesPcs: 0, salesUah: 0 });
  });

  it("applies recountDays", async () => {
    await Konk.updateOne(
      { name: konkName },
      { $set: { recountDays: ["2026-06-02"] } },
    );
    await seedSkuSliceMonthDay(konkName, d0, { p1: { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d1, { p1: { stock: 7, price: 5 } });

    await afterSkuSliceStockMutation({ konkName, dayD: d1 });
    const row = await SkuManufacturerDaySales.findOne({
      konkName,
      date: d1,
    }).lean();
    expect(row).toMatchObject({ salesPcs: 0, salesUah: 0 });
  });

  it("dry-run does not write rollup", async () => {
    await seedSkuSliceMonthDay(konkName, d0, { p1: { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d1, { p1: { stock: 7, price: 5 } });

    const result = await materializeSkuSliceSalesForKonkDays({
      konkName,
      dayD: d1,
      apply: false,
    });
    expect(result.keysUpdated).toBeGreaterThan(0);
    expect(result.rollupDocs).toBeGreaterThan(0);
    expect(await SkuManufacturerDaySales.countDocuments({ konkName })).toBe(0);
  });

  it("materializeSkuSliceSalesDateRange calls onProgress and replaces day", async () => {
    await seedSkuSliceMonthDay(konkName, d0, { p1: { stock: 10, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d1, { p1: { stock: 7, price: 5 } });
    await seedSkuSliceMonthDay(konkName, d2, { p1: { stock: 4, price: 5 } });

    const progress: Array<{ day: string; dayIndex: number; dayTotal: number }> =
      [];
    await materializeSkuSliceSalesDateRange({
      konkName,
      fromDate: d1,
      toDate: d2,
      apply: true,
      onProgress: (info) => {
        progress.push({
          day: info.day,
          dayIndex: info.dayIndex,
          dayTotal: info.dayTotal,
        });
      },
    });

    expect(progress).toHaveLength(2);
    expect(await SkuManufacturerDaySales.countDocuments({ konkName })).toBe(2);
  });

  it("aggregates multiple productIds into one prodName bucket", async () => {
    await Sku.create({
      konkName,
      prodName: "MakerX",
      productId: "p2",
      title: "P2",
      url: "https://example.com/p2",
    });
    await seedSkuSliceMonthDay(konkName, d0, {
      p1: { stock: 10, price: 5 },
      p2: { stock: 20, price: 2 },
    });
    await seedSkuSliceMonthDay(konkName, d1, {
      p1: { stock: 7, price: 5 },
      p2: { stock: 18, price: 2 },
    });

    await afterSkuSliceStockMutation({ konkName, dayD: d1 });
    const rows = await SkuManufacturerDaySales.find({
      konkName,
      date: d1,
    }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      prodName: "MakerX",
      salesPcs: 5,
      salesUah: 19,
    });
  });
});
