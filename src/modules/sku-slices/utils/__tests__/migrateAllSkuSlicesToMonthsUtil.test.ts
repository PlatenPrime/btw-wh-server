import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSlice } from "../../models/SkuSlice.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import {
  migrateAllSkuSlicesToMonthsUtil,
  verifyRandomSkuSlicesVsMonths,
} from "../migrateAllSkuSlicesToMonthsUtil.js";

describe("migrateAllSkuSlicesToMonthsUtil", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("dry-run does not write", async () => {
    await SkuSlice.create({
      konkName: "air",
      date: new Date("2026-10-09T00:00:00.000Z"),
      data: { a: { stock: 1, price: 2 } },
    });
    const result = await migrateAllSkuSlicesToMonthsUtil({ apply: false });
    expect(result.slicesRead).toBe(1);
    expect(result.dayWritesWouldWrite).toBe(1);
    expect(result.dayWritesUpserted).toBe(0);
    expect(await SkuSliceMonth.countDocuments()).toBe(0);
  });

  it("apply overwrites and verify passes", async () => {
    const d0 = new Date("2026-09-15T00:00:00.000Z");
    const d1 = new Date("2026-10-09T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "air",
      date: d0,
      data: { a: { stock: 1, price: 1 } },
    });
    await SkuSlice.create({
      konkName: "sharik",
      date: d1,
      data: { b: { stock: 5, price: 6 }, c: { stock: -1, price: -1 } },
    });

    // stale month data to overwrite
    await SkuSliceMonth.create({
      konkName: "sharik",
      productId: "b",
      month: new Date("2026-10-01T00:00:00.000Z"),
      days: { "2026-10-09": { stock: 999, price: 999 } },
    });

    const progress: string[] = [];
    const result = await migrateAllSkuSlicesToMonthsUtil({
      apply: true,
      onProgress: (p) =>
        progress.push(`${p.sliceIndex}/${p.slicesTotal} ${p.konkName}`),
    });
    expect(result.slicesRead).toBe(2);
    expect(result.dayWritesUpserted).toBe(3);
    expect(progress).toHaveLength(2);

    const b = await SkuSliceMonth.findOne({
      konkName: "sharik",
      productId: "b",
    }).lean();
    expect(b?.days?.["2026-10-09"]).toEqual({ stock: 5, price: 6 });

    const verify = await verifyRandomSkuSlicesVsMonths(10);
    expect(verify.ok).toBe(true);
    expect(verify.compared).toBeGreaterThan(0);
  });

  it("konk filter", async () => {
    await SkuSlice.create({
      konkName: "air",
      date: new Date("2026-10-09T00:00:00.000Z"),
      data: { a: { stock: 1, price: 1 } },
    });
    await SkuSlice.create({
      konkName: "sharik",
      date: new Date("2026-10-09T00:00:00.000Z"),
      data: { b: { stock: 1, price: 1 } },
    });
    const result = await migrateAllSkuSlicesToMonthsUtil({
      apply: true,
      konkName: "air",
    });
    expect(result.slicesRead).toBe(1);
    expect(await SkuSliceMonth.countDocuments({ konkName: "air" })).toBe(1);
    expect(await SkuSliceMonth.countDocuments({ konkName: "sharik" })).toBe(0);
  });
});
