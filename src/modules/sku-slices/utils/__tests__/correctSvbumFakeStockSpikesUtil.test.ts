import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../models/SkuSlice.js";
import { correctSvbumFakeStockSpikesUtil } from "../correctSvbumFakeStockSpikesUtil.js";

const D0 = new Date("2026-09-13T00:00:00.000Z");
const D1 = new Date("2026-09-14T00:00:00.000Z");
const D2 = new Date("2026-09-15T00:00:00.000Z");

async function seedSvbum(
  rows: Array<{
    date: Date;
    data: Record<string, { stock: number; price: number }>;
  }>
): Promise<void> {
  for (const row of rows) {
    await SkuSlice.create({
      konkName: "svbum",
      date: row.date,
      data: row.data,
    });
  }
}

describe("correctSvbumFakeStockSpikesUtil", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
  });

  it("rejects daysBack < 1", async () => {
    await expect(
      correctSvbumFakeStockSpikesUtil({ daysBack: 0 })
    ).rejects.toThrow(/daysBack/);
  });

  it("dry-run finds sandwich patches and does not write", async () => {
    await seedSvbum([
      { date: D0, data: { "svbum-1": { stock: 6_000_000, price: 10 } } },
      { date: D1, data: { "svbum-1": { stock: 10_000, price: 10 } } },
      { date: D2, data: { "svbum-1": { stock: 6_000_000, price: 11 } } },
    ]);

    const result = await correctSvbumFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: false,
    });

    expect(result.apply).toBe(false);
    expect(result.konkName).toBe("svbum");
    expect(result.patched).toEqual([
      { productId: "svbum-1", date: "2026-09-13", from: 6_000_000, to: 0 },
      { productId: "svbum-1", date: "2026-09-14", from: 10_000, to: 0 },
      { productId: "svbum-1", date: "2026-09-15", from: 6_000_000, to: 0 },
    ]);

    const mid = await SkuSlice.findOne({ konkName: "svbum", date: D1 }).lean();
    expect(mid?.data?.["svbum-1"]).toEqual({ stock: 10_000, price: 10 });
  });

  it("applies sandwich zeros and keeps price", async () => {
    await seedSvbum([
      { date: D0, data: { "svbum-1": { stock: 6_000_000, price: 99 } } },
      { date: D1, data: { "svbum-1": { stock: 10_000, price: 99 } } },
      { date: D2, data: { "svbum-1": { stock: 6_000_000, price: 99 } } },
    ]);

    await correctSvbumFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: true,
    });

    const d0 = await SkuSlice.findOne({ konkName: "svbum", date: D0 }).lean();
    const d1 = await SkuSlice.findOne({ konkName: "svbum", date: D1 }).lean();
    const d2 = await SkuSlice.findOne({ konkName: "svbum", date: D2 }).lean();
    expect(d0?.data?.["svbum-1"]).toEqual({ stock: 0, price: 99 });
    expect(d1?.data?.["svbum-1"]).toEqual({ stock: 0, price: 99 });
    expect(d2?.data?.["svbum-1"]).toEqual({ stock: 0, price: 99 });
  });

  it("does not zero trailing spike on asOf with no day to the right", async () => {
    await seedSvbum([
      { date: D0, data: { "svbum-1": { stock: 100, price: 1 } } },
      { date: D1, data: { "svbum-1": { stock: 6_000_000, price: 1 } } },
    ]);

    const result = await correctSvbumFakeStockSpikesUtil({
      daysBack: 2,
      asOf: D1,
      apply: true,
      lookbackDays: 0,
    });

    expect(result.patched).toEqual([]);
    const d1 = await SkuSlice.findOne({ konkName: "svbum", date: D1 }).lean();
    expect(d1?.data?.["svbum-1"]).toEqual({ stock: 6_000_000, price: 1 });
  });

  it("zeros needle spike between normals after one day to the right", async () => {
    await seedSvbum([
      { date: D0, data: { "svbum-1": { stock: 12, price: 1 } } },
      { date: D1, data: { "svbum-1": { stock: 1_000_000, price: 1 } } },
      { date: D2, data: { "svbum-1": { stock: 12, price: 1 } } },
    ]);

    const result = await correctSvbumFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: true,
      lookbackDays: 0,
    });

    expect(result.patched).toEqual([
      { productId: "svbum-1", date: "2026-09-14", from: 1_000_000, to: 0 },
    ]);
    const d0 = await SkuSlice.findOne({ konkName: "svbum", date: D0 }).lean();
    const d1 = await SkuSlice.findOne({ konkName: "svbum", date: D1 }).lean();
    const d2 = await SkuSlice.findOne({ konkName: "svbum", date: D2 }).lean();
    expect(d0?.data?.["svbum-1"]).toEqual({ stock: 12, price: 1 });
    expect(d1?.data?.["svbum-1"]).toEqual({ stock: 0, price: 1 });
    expect(d2?.data?.["svbum-1"]).toEqual({ stock: 12, price: 1 });
  });

  it("zeros lone spike after grace days", async () => {
    await seedSvbum([
      { date: D0, data: { "svbum-1": { stock: 6_000_000, price: 1 } } },
      { date: D1, data: { "svbum-1": { stock: 100, price: 1 } } },
    ]);

    const result = await correctSvbumFakeStockSpikesUtil({
      daysBack: 2,
      asOf: D1,
      apply: true,
      lookbackDays: 0,
    });

    expect(result.patched).toEqual([
      { productId: "svbum-1", date: "2026-09-13", from: 6_000_000, to: 0 },
    ]);
    const d0 = await SkuSlice.findOne({ konkName: "svbum", date: D0 }).lean();
    const d1 = await SkuSlice.findOne({ konkName: "svbum", date: D1 }).lean();
    expect(d0?.data?.["svbum-1"]).toEqual({ stock: 0, price: 1 });
    expect(d1?.data?.["svbum-1"]).toEqual({ stock: 100, price: 1 });
  });

  it("does not touch other competitors", async () => {
    await SkuSlice.create({
      konkName: "balun",
      date: D1,
      data: { "balun-1": { stock: 6_000_000, price: 5 } },
    });
    await seedSvbum([
      { date: D0, data: { "svbum-1": { stock: 6_000_000, price: 1 } } },
      { date: D1, data: { "svbum-1": { stock: 10, price: 1 } } },
      { date: D2, data: { "svbum-1": { stock: 6_000_000, price: 1 } } },
    ]);

    await correctSvbumFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: true,
    });

    const balun = await SkuSlice.findOne({ konkName: "balun", date: D1 }).lean();
    expect(balun?.data?.["balun-1"]).toEqual({ stock: 6_000_000, price: 5 });
  });
});
