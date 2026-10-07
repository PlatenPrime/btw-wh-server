import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkuSlice } from "../../models/SkuSlice.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { materializeSkuSliceMonthsUtil } from "../materializeSkuSliceMonthsUtil.js";

describe("materializeSkuSliceMonthsUtil", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("rejects daysBack < 1", async () => {
    await expect(
      materializeSkuSliceMonthsUtil({ daysBack: 0 }),
    ).rejects.toThrow(/daysBack/);
  });

  it("dry-run counts day writes and does not write", async () => {
    await SkuSlice.create({
      konkName: "air",
      date: new Date("2026-03-01T00:00:00.000Z"),
      data: {
        "air-1": { stock: 10, price: 5 },
        "air-2": { stock: -1, price: -1 },
      },
    });

    const result = await materializeSkuSliceMonthsUtil({
      daysBack: 1,
      asOf: new Date("2026-03-01T00:00:00.000Z"),
      apply: false,
    });

    expect(result.apply).toBe(false);
    expect(result.slicesRead).toBe(1);
    expect(result.dayWritesWouldWrite).toBe(2);
    expect(result.dayWritesUpserted).toBe(0);
    expect(result.monthsTouched).toBe(2);
    expect(await SkuSliceMonth.countDocuments()).toBe(0);
    expect(await SkuSlice.countDocuments()).toBe(1);
  });

  it("apply upserts days into month docs and leaves SkuSlice untouched", async () => {
    const date = new Date("2026-03-02T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "air",
      date,
      data: { "air-1": { stock: 7, price: 3 } },
    });

    const progress: Array<{ sliceIndex: number; daysWrittenInSlice: number }> =
      [];
    const result = await materializeSkuSliceMonthsUtil({
      daysBack: 1,
      asOf: date,
      apply: true,
      onProgress: (info) => {
        progress.push({
          sliceIndex: info.sliceIndex,
          daysWrittenInSlice: info.daysWrittenInSlice,
        });
      },
    });

    expect(result.dayWritesUpserted).toBe(1);
    expect(result.monthsTouched).toBe(1);
    expect(progress).toEqual([{ sliceIndex: 1, daysWrittenInSlice: 1 }]);

    const doc = await SkuSliceMonth.findOne({
      konkName: "air",
      productId: "air-1",
      month: new Date("2026-03-01T00:00:00.000Z"),
    }).lean();
    expect(doc?.days["2026-03-02"]).toEqual({ stock: 7, price: 3 });

    const slice = await SkuSlice.findOne({ konkName: "air", date }).lean();
    expect(slice?.data).toEqual({ "air-1": { stock: 7, price: 3 } });
  });

  it("re-apply overwrites a day key and keeps other days", async () => {
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await SkuSlice.insertMany([
      {
        konkName: "balun",
        date: d1,
        data: { "balun-1": { stock: 1, price: 2 } },
      },
      {
        konkName: "balun",
        date: d2,
        data: { "balun-1": { stock: 3, price: 4 } },
      },
    ]);

    await materializeSkuSliceMonthsUtil({
      daysBack: 2,
      asOf: d2,
      apply: true,
    });

    await SkuSlice.updateOne(
      { konkName: "balun", date: d2 },
      { $set: { "data.balun-1": { stock: 99, price: 8 } } },
    );

    await materializeSkuSliceMonthsUtil({
      daysBack: 1,
      asOf: d2,
      apply: true,
    });

    const doc = await SkuSliceMonth.findOne({
      konkName: "balun",
      productId: "balun-1",
      month: new Date("2026-03-01T00:00:00.000Z"),
    }).lean();
    expect(doc?.days["2026-03-01"]).toEqual({ stock: 1, price: 2 });
    expect(doc?.days["2026-03-02"]).toEqual({ stock: 99, price: 8 });
    expect(await SkuSliceMonth.countDocuments()).toBe(1);
  });

  it("spans two calendar months for a 30-day window", async () => {
    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: new Date("2026-09-08T00:00:00.000Z"),
        data: { "air-x": { stock: 1, price: 1 } },
      },
      {
        konkName: "air",
        date: new Date("2026-10-07T00:00:00.000Z"),
        data: { "air-x": { stock: 2, price: 2 } },
      },
    ]);

    const result = await materializeSkuSliceMonthsUtil({
      daysBack: 30,
      asOf: new Date("2026-10-07T00:00:00.000Z"),
      apply: true,
    });

    expect(result.monthsTouched).toBe(2);
    expect(await SkuSliceMonth.countDocuments()).toBe(2);

    const sep = await SkuSliceMonth.findOne({
      productId: "air-x",
      month: new Date("2026-09-01T00:00:00.000Z"),
    }).lean();
    const oct = await SkuSliceMonth.findOne({
      productId: "air-x",
      month: new Date("2026-10-01T00:00:00.000Z"),
    }).lean();
    expect(sep?.days["2026-09-08"]).toEqual({ stock: 1, price: 1 });
    expect(oct?.days["2026-10-07"]).toEqual({ stock: 2, price: 2 });
  });

  it("filters by konkName and daysBack window", async () => {
    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: new Date("2026-03-01T00:00:00.000Z"),
        data: { "air-old": { stock: 1, price: 1 } },
      },
      {
        konkName: "air",
        date: new Date("2026-03-10T00:00:00.000Z"),
        data: { "air-new": { stock: 2, price: 2 } },
      },
      {
        konkName: "sharik",
        date: new Date("2026-03-10T00:00:00.000Z"),
        data: { "sharik-1": { stock: 3, price: 3 } },
      },
    ]);

    const result = await materializeSkuSliceMonthsUtil({
      daysBack: 5,
      asOf: new Date("2026-03-10T00:00:00.000Z"),
      konkName: "air",
      apply: true,
    });

    expect(result.slicesRead).toBe(1);
    expect(result.dayWritesUpserted).toBe(1);
    expect(await SkuSliceMonth.countDocuments({ konkName: "air" })).toBe(1);
    expect(await SkuSliceMonth.countDocuments({ konkName: "sharik" })).toBe(0);
  });

  it("does not call deleteMany on SkuSliceMonth", async () => {
    const date = new Date("2026-03-05T00:00:00.000Z");
    await SkuSliceMonth.create({
      konkName: "air",
      productId: "orphan",
      month: new Date("2026-03-01T00:00:00.000Z"),
      days: { "2026-03-01": { stock: 1, price: 1 } },
    });
    await SkuSlice.create({
      konkName: "air",
      date,
      data: { "air-1": { stock: 2, price: 2 } },
    });

    const deleteSpy = vi.spyOn(SkuSliceMonth, "deleteMany");

    await materializeSkuSliceMonthsUtil({
      daysBack: 1,
      asOf: date,
      apply: true,
    });

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(await SkuSliceMonth.countDocuments()).toBe(2);
    deleteSpy.mockRestore();
  });

  it("walks multi-day window chronologically without mongo sort on Mixed", async () => {
    await SkuSlice.insertMany([
      {
        konkName: "zulu",
        date: new Date("2026-03-10T00:00:00.000Z"),
        data: { "z-1": { stock: 1, price: 1 } },
      },
      {
        konkName: "air",
        date: new Date("2026-03-08T00:00:00.000Z"),
        data: { "a-1": { stock: 2, price: 2 } },
      },
      {
        konkName: "balun",
        date: new Date("2026-03-09T00:00:00.000Z"),
        data: { "b-1": { stock: 3, price: 3 } },
      },
    ]);

    const findSpy = vi.spyOn(SkuSlice, "find");
    const progressDates: string[] = [];

    const result = await materializeSkuSliceMonthsUtil({
      daysBack: 3,
      asOf: new Date("2026-03-10T00:00:00.000Z"),
      apply: true,
      onProgress: (info) => {
        progressDates.push(info.date);
      },
    });

    expect(result.slicesRead).toBe(3);
    expect(result.dayWritesUpserted).toBe(3);
    expect(progressDates).toEqual([
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);

    const findCalls = findSpy.mock.calls as unknown as Array<
      [filter?: { date?: unknown }]
    >;
    for (const call of findCalls) {
      expect(call[0]?.date).toBeInstanceOf(Date);
    }
    findSpy.mockRestore();
  });
});
