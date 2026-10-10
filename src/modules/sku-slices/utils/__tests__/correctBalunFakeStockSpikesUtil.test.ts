import { beforeEach, describe, expect, it } from "vitest";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { getDayPoint } from "../skuSliceMonthStore.js";
import { seedSkuSliceMonthDay } from "../seedSkuSliceMonthDay.js";
import { correctBalunFakeStockSpikesUtil } from "../correctBalunFakeStockSpikesUtil.js";

const D0 = new Date("2026-09-13T00:00:00.000Z");
const D1 = new Date("2026-09-14T00:00:00.000Z");
const D2 = new Date("2026-09-15T00:00:00.000Z");
const D3 = new Date("2026-09-16T00:00:00.000Z");

async function seedBalun(
  rows: Array<{
    date: Date;
    data: Record<string, { stock: number; price: number }>;
  }>,
): Promise<void> {
  for (const row of rows) {
    await seedSkuSliceMonthDay("balun", row.date, row.data);
  }
}

describe("correctBalunFakeStockSpikesUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("rejects daysBack < 1", async () => {
    await expect(
      correctBalunFakeStockSpikesUtil({ daysBack: 0 })
    ).rejects.toThrow(/daysBack/);
  });

  it("dry-run finds patches and does not write", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 543, price: 10 } } },
      { date: D1, data: { "balun-1": { stock: 10000, price: 10 } } },
      { date: D2, data: { "balun-1": { stock: 10000, price: 11 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: false,
    });

    expect(result.apply).toBe(false);
    expect(result.konkName).toBe("balun");
    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-14", from: 10000, to: 543 },
      { productId: "balun-1", date: "2026-09-15", from: 10000, to: 543 },
    ]);

    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({
      stock: 10000,
      price: 10,
    });
  });

  it("applies patches for mid-range fake stock and keeps price", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 543, price: 10 } } },
      { date: D1, data: { "balun-1": { stock: 9975, price: 99 } } },
      { date: D2, data: { "balun-1": { stock: 200, price: 12 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: true,
    });

    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-14", from: 9975, to: 543 },
    ]);

    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({
      stock: 543,
      price: 99,
    });
    expect(await getDayPoint("balun", "balun-1", D2)).toEqual({
      stock: 200,
      price: 12,
    });
  });

  it("uses lookback outside the window", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 777, price: 1 } } },
      { date: D1, data: { "balun-1": { stock: 10000, price: 1 } } },
      { date: D2, data: { "balun-1": { stock: 10000, price: 1 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 2,
      asOf: D2,
      apply: true,
      lookbackDays: 10,
    });

    expect(result.windowDates).toEqual(["2026-09-14", "2026-09-15"]);
    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-14", from: 10000, to: 777 },
      { productId: "balun-1", date: "2026-09-15", from: 10000, to: 777 },
    ]);

    expect(await getDayPoint("balun", "balun-1", D0)).toEqual({
      stock: 777,
      price: 1,
    });
  });

  it("does not touch other competitors", async () => {
    await seedSkuSliceMonthDay("air", D1, {
      "air-1": { stock: 10000, price: 5 },
    });
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 10, price: 1 } } },
      { date: D1, data: { "balun-1": { stock: 10000, price: 1 } } },
    ]);

    await correctBalunFakeStockSpikesUtil({
      daysBack: 2,
      asOf: D1,
      apply: true,
    });

    expect(await getDayPoint("air", "air-1", D1)).toEqual({
      stock: 10000,
      price: 5,
    });
  });

  it("skips when no adequate neighbor inside lookback", async () => {
    await seedBalun([
      { date: D1, data: { "balun-1": { stock: 10000, price: 1 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 1,
      asOf: D1,
      apply: true,
      lookbackDays: 5,
    });

    expect(result.patched).toEqual([]);
    expect(result.skipped).toEqual([
      {
        productId: "balun-1",
        date: "2026-09-14",
        reason: "no-adequate-neighbor",
      },
    ]);
  });

  it("skips -1 when finding left adequate", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 40, price: 1 } } },
      { date: D1, data: { "balun-1": { stock: -1, price: -1 } } },
      { date: D2, data: { "balun-1": { stock: 10000, price: 2 } } },
      { date: D3, data: { "balun-1": { stock: 10000, price: 3 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 4,
      asOf: D3,
      apply: true,
    });

    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-15", from: 10000, to: 40 },
      { productId: "balun-1", date: "2026-09-16", from: 10000, to: 40 },
    ]);

    expect(await getDayPoint("balun", "balun-1", D2)).toEqual({
      stock: 40,
      price: 2,
    });
  });

  it("applies patches for spike-range fake stock and keeps price", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 4, price: 15.53 } } },
      { date: D1, data: { "balun-1": { stock: 4995, price: 15.53 } } },
      { date: D2, data: { "balun-1": { stock: 4, price: 15.53 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: true,
    });

    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-14", from: 4995, to: 4 },
    ]);

    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({
      stock: 4,
      price: 15.53,
    });
    expect(await getDayPoint("balun", "balun-1", D2)).toEqual({
      stock: 4,
      price: 15.53,
    });
  });

  it("applies leading 5000 using nearest right adequate", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 5000, price: 15.53 } } },
      { date: D1, data: { "balun-1": { stock: 5000, price: 15.53 } } },
      { date: D2, data: { "balun-1": { stock: 4, price: 15.53 } } },
    ]);

    const result = await correctBalunFakeStockSpikesUtil({
      daysBack: 3,
      asOf: D2,
      apply: true,
    });

    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-13", from: 5000, to: 4 },
      { productId: "balun-1", date: "2026-09-14", from: 5000, to: 4 },
    ]);

    expect(await getDayPoint("balun", "balun-1", D0)).toEqual({
      stock: 4,
      price: 15.53,
    });
    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({
      stock: 4,
      price: 15.53,
    });
  });
});
