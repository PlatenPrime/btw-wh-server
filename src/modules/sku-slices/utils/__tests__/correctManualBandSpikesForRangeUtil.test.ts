import { beforeEach, describe, expect, it } from "vitest";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { getDayPoint } from "../skuSliceMonthStore.js";
import { seedSkuSliceMonthDay } from "../seedSkuSliceMonthDay.js";
import { correctManualBandSpikesForRangeUtil } from "../correctManualBandSpikesForRangeUtil.js";

const D0 = new Date("2026-09-13T00:00:00.000Z");
const D1 = new Date("2026-09-14T00:00:00.000Z");
const D2 = new Date("2026-09-15T00:00:00.000Z");
const D3 = new Date("2026-09-16T00:00:00.000Z");

async function seedKonk(
  konkName: string,
  rows: Array<{
    date: Date;
    data: Record<string, { stock: number; price: number }>;
  }>,
): Promise<void> {
  for (const row of rows) {
    await seedSkuSliceMonthDay(konkName, row.date, row.data);
  }
}

describe("correctManualBandSpikesForRangeUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("patches only sandwich product among two for balun band", async () => {
    await seedKonk("balun", [
      { date: D0, data: { "balun-spike": { stock: 5, price: 10 } } },
      { date: D1, data: { "balun-spike": { stock: 9937, price: 10 } } },
      { date: D2, data: { "balun-spike": { stock: 9937, price: 10 } } },
      { date: D3, data: { "balun-spike": { stock: 59, price: 10 } } },
    ]);
    await seedKonk("balun", [
      { date: D0, data: { "balun-calm": { stock: 10, price: 10 } } },
      { date: D1, data: { "balun-calm": { stock: 12, price: 10 } } },
      { date: D2, data: { "balun-calm": { stock: 11, price: 10 } } },
      { date: D3, data: { "balun-calm": { stock: 10, price: 10 } } },
    ]);

    const result = await correctManualBandSpikesForRangeUtil({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: D1,
      dateTo: D2,
      apply: true,
    });

    expect(result.band).toEqual({ min: 9000, max: 11000 });
    expect(result.konkName).toBe("balun");
    expect(result.patched.filter((p) => p.productId === "balun-spike")).toEqual([
      { productId: "balun-spike", date: "2026-09-14", from: 9937, to: 59 },
      { productId: "balun-spike", date: "2026-09-15", from: 9937, to: 59 },
    ]);
    expect(result.patched.filter((p) => p.productId === "balun-calm")).toEqual([]);
    expect(await getDayPoint("balun", "balun-spike", D1)).toEqual({ stock: 59, price: 10 });
  });

  it("works for svbum with million band", async () => {
    await seedKonk("svbum", [
      { date: D0, data: { "sv-1": { stock: 100, price: 10 } } },
      { date: D1, data: { "sv-1": { stock: 1_500_000, price: 10 } } },
      { date: D2, data: { "sv-1": { stock: 80, price: 10 } } },
    ]);

    const result = await correctManualBandSpikesForRangeUtil({
      konkName: "svbum",
      stockMin: 900_000,
      stockMax: 9_999_999,
      dateFrom: D1,
      dateTo: D1,
      apply: true,
      productIds: ["sv-1"],
    });

    expect(result.patched).toEqual([
      { productId: "sv-1", date: "2026-09-14", from: 1_500_000, to: 80 },
    ]);
    expect(await getDayPoint("svbum", "sv-1", D1)).toEqual({ stock: 80, price: 10 });
  });

  it("preview does not write", async () => {
    await seedKonk("balun", [
      { date: D0, data: { "balun-1": { stock: 5, price: 10 } } },
      { date: D1, data: { "balun-1": { stock: 9937, price: 10 } } },
      { date: D2, data: { "balun-1": { stock: 8, price: 10 } } },
    ]);

    const result = await correctManualBandSpikesForRangeUtil({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: D1,
      dateTo: D1,
      apply: false,
      productIds: ["balun-1"],
    });

    expect(result.patched).toEqual([
      { productId: "balun-1", date: "2026-09-14", from: 9937, to: 8 },
    ]);
    expect(result.apply).toBe(false);
    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({ stock: 9937, price: 10 });
  });
});
