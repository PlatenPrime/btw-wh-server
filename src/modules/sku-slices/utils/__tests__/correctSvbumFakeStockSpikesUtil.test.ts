import { beforeEach, describe, expect, it } from "vitest";
import { correctSvbumFakeStockSpikesUtil } from "../correctSvbumFakeStockSpikesUtil.js";
import { seedSkuSliceMonthDay } from "../seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { getDayPoint } from "../skuSliceMonthStore.js";

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
    await seedSkuSliceMonthDay("svbum", row.date, row.data);
  }
}

describe("correctSvbumFakeStockSpikesUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
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

    expect(await getDayPoint("svbum", "svbum-1", D1)).toEqual({ stock: 10_000, price: 10 });
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

    expect(await getDayPoint("svbum", "svbum-1", D0)).toEqual({ stock: 0, price: 99 });
    expect(await getDayPoint("svbum", "svbum-1", D1)).toEqual({ stock: 0, price: 99 });
    expect(await getDayPoint("svbum", "svbum-1", D2)).toEqual({ stock: 0, price: 99 });
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
    expect(await getDayPoint("svbum", "svbum-1", D1)).toEqual({ stock: 6_000_000, price: 1 });
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
    expect(await getDayPoint("svbum", "svbum-1", D0)).toEqual({ stock: 12, price: 1 });
    expect(await getDayPoint("svbum", "svbum-1", D1)).toEqual({ stock: 0, price: 1 });
    expect(await getDayPoint("svbum", "svbum-1", D2)).toEqual({ stock: 12, price: 1 });
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
    expect(await getDayPoint("svbum", "svbum-1", D0)).toEqual({ stock: 0, price: 1 });
    expect(await getDayPoint("svbum", "svbum-1", D1)).toEqual({ stock: 100, price: 1 });
  });

  it("does not touch other competitors", async () => {
    await seedSkuSliceMonthDay("balun", D1, { "balun-1": { stock: 6_000_000, price: 5 } });
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

    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({ stock: 6_000_000, price: 5 });
  });
});
