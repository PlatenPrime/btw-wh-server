import { beforeEach, describe, expect, it } from "vitest";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import { getDayPoint } from "../skuSliceMonthStore.js";
import { seedSkuSliceMonthDay } from "../seedSkuSliceMonthDay.js";
import { correctBalunManualBandSpikesForRangeUtil } from "../correctBalunManualBandSpikesForRangeUtil.js";

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

describe("correctBalunManualBandSpikesForRangeUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("patches only sandwich product among two", async () => {
    await seedBalun([
      { date: D0, data: { "balun-spike": { stock: 5, price: 10 } } },
      { date: D1, data: { "balun-spike": { stock: 9937, price: 10 } } },
      { date: D2, data: { "balun-spike": { stock: 9937, price: 10 } } },
      { date: D3, data: { "balun-spike": { stock: 59, price: 10 } } },
    ]);
    await seedBalun([
      { date: D0, data: { "balun-calm": { stock: 10, price: 10 } } },
      { date: D1, data: { "balun-calm": { stock: 12, price: 10 } } },
      { date: D2, data: { "balun-calm": { stock: 11, price: 10 } } },
      { date: D3, data: { "balun-calm": { stock: 10, price: 10 } } },
    ]);

    expect(await getDayPoint("balun", "balun-spike", D1)).toEqual({ stock: 9937, price: 10 });
    expect(await getDayPoint("balun", "balun-calm", D1)).toEqual({ stock: 12, price: 10 });

    const result = await correctBalunManualBandSpikesForRangeUtil({
      dateFrom: D1,
      dateTo: D2,
      apply: true,
    });

    expect(result.patched.filter((p) => p.productId === "balun-spike")).toEqual([
      { productId: "balun-spike", date: "2026-09-14", from: 9937, to: 59 },
      { productId: "balun-spike", date: "2026-09-15", from: 9937, to: 59 },
    ]);
    expect(result.patched.filter((p) => p.productId === "balun-calm")).toEqual([]);

    expect(await getDayPoint("balun", "balun-spike", D1)).toEqual({ stock: 59, price: 10 });
    expect(await getDayPoint("balun", "balun-calm", D1)).toEqual({ stock: 12, price: 10 });
  });

  it("preview does not write", async () => {
    await seedBalun([
      { date: D0, data: { "balun-1": { stock: 5, price: 10 } } },
      { date: D1, data: { "balun-1": { stock: 9937, price: 10 } } },
      { date: D2, data: { "balun-1": { stock: 8, price: 10 } } },
    ]);

    expect(await getDayPoint("balun", "balun-1", D1)).toEqual({ stock: 9937, price: 10 });

    const result = await correctBalunManualBandSpikesForRangeUtil({
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
