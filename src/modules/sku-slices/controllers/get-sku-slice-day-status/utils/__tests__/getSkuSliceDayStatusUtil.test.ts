import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { SkuSliceDayMeta } from "../../../../models/SkuSliceDayMeta.js";
import { SkuSliceMonth } from "../../../../models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../../../../utils/seedSkuSliceMonthDay.js";
import { getSkuSliceDayStatusUtil } from "../getSkuSliceDayStatusUtil.js";

describe("getSkuSliceDayStatusUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
    await SkuSliceDayMeta.deleteMany({});
  });

  it("returns counts from months and meta stats", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await seedSkuSliceMonthDay("air", date, {
      a: { stock: 1, price: 2 },
      b: { stock: -1, price: -1 },
    });
    await SkuSliceDayMeta.create({
      konkName: "air",
      date,
      stats: { filled: 1, invalid: 1, errorCount: 0, abortReason: "origin_blocked" },
      rotationMeta: { cycleDays: 3, dayIndex: 1, dueCount: 10 },
    });

    const result = await getSkuSliceDayStatusUtil({
      konkName: "air",
      date,
    });
    expect(result.pointsTotal).toBe(2);
    expect(result.pointsInvalid).toBe(1);
    expect(result.stats?.filled).toBe(1);
    expect(result.stats?.abortReason).toBe("origin_blocked");
    expect(result.rotationMeta?.dueCount).toBe(10);
  });

  it("works without DayMeta", async () => {
    const result = await getSkuSliceDayStatusUtil({
      konkName: "air",
      date: new Date("2026-10-09T00:00:00.000Z"),
    });
    expect(result.stats).toBeNull();
    expect(result.pointsTotal).toBe(0);
  });
});
