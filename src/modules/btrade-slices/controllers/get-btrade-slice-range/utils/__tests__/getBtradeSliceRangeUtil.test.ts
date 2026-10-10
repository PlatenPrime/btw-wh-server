import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSliceMonth } from "../../../../models/BtradeSliceMonth.js";
import { seedBtradeSliceMonthDay } from "../../../../utils/seedBtradeSliceMonthDay.js";
import { getBtradeSliceRangeUtil } from "../getBtradeSliceRangeUtil.js";

describe("getBtradeSliceRangeUtil", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSliceMonth.deleteMany({});
  });

  it("returns ok false when art missing", async () => {
    const r = await getBtradeSliceRangeUtil({
      artikul: "missing",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-02T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("returns range items for existing slice data", async () => {
    await Art.create({ artikul: "ART-1", zone: "A" });
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    await seedBtradeSliceMonthDay(d1, {
      "ART-1": { quantity: 5, price: 100 },
    });

    const r = await getBtradeSliceRangeUtil({
      artikul: "ART-1",
      dateFrom: d1,
      dateTo: d1,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual([
        { date: d1.toISOString(), quantity: 5, price: 100 },
      ]);
    }
  });
});
