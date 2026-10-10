import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { BtradeSlice } from "../../models/BtradeSlice.js";
import { BtradeSliceMonth } from "../../models/BtradeSliceMonth.js";
import {
  migrateAllBtradeSlicesToMonthsUtil,
  verifyRandomBtradeSlicesVsMonths,
} from "../migrateAllBtradeSlicesToMonthsUtil.js";

describe("migrateAllBtradeSlicesToMonthsUtil", () => {
  beforeEach(async () => {
    await BtradeSlice.deleteMany({});
    await BtradeSliceMonth.deleteMany({});
  });

  it("dry-run does not write", async () => {
    await BtradeSlice.create({
      date: new Date("2026-10-09T00:00:00.000Z"),
      data: { a: { quantity: 1, price: 2 } },
    });
    const result = await migrateAllBtradeSlicesToMonthsUtil({ apply: false });
    expect(result.slicesRead).toBe(1);
    expect(result.dayWritesWouldWrite).toBe(1);
    expect(result.dayWritesUpserted).toBe(0);
    expect(await BtradeSliceMonth.countDocuments()).toBe(0);
  });

  it("apply overwrites and verify passes", async () => {
    const d0 = new Date("2026-09-15T00:00:00.000Z");
    const d1 = new Date("2026-10-09T00:00:00.000Z");
    await BtradeSlice.create({
      date: d0,
      data: { a: { quantity: 1, price: 1 } },
    });
    await BtradeSlice.create({
      date: d1,
      data: { b: { quantity: 5, price: 6 }, c: { quantity: -1, price: -1 } },
    });

    await BtradeSliceMonth.create({
      artikul: "b",
      month: new Date("2026-10-01T00:00:00.000Z"),
      days: { "2026-10-09": { quantity: 999, price: 999 } },
    });

    const progress: string[] = [];
    const result = await migrateAllBtradeSlicesToMonthsUtil({
      apply: true,
      onProgress: (p) =>
        progress.push(`${p.sliceIndex}/${p.slicesTotal} ${p.date}`),
    });
    expect(result.slicesRead).toBe(2);
    expect(result.dayWritesUpserted).toBe(3);
    expect(progress).toHaveLength(2);

    const b = await BtradeSliceMonth.findOne({ artikul: "b" }).lean();
    expect(b?.days?.["2026-10-09"]).toEqual({ quantity: 5, price: 6 });

    const verify = await verifyRandomBtradeSlicesVsMonths(10);
    expect(verify.ok).toBe(true);
    expect(verify.compared).toBeGreaterThan(0);
  });
});
