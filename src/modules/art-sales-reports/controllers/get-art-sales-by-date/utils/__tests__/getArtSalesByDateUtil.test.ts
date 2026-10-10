import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSliceMonth } from "../../../../../btrade-slices/models/BtradeSliceMonth.js";
import { seedBtradeSliceMonthDay } from "../../../../../btrade-slices/utils/seedBtradeSliceMonthDay.js";
import { getArtSalesByDateUtil } from "../getArtSalesByDateUtil.js";

describe("getArtSalesByDateUtil", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSliceMonth.deleteMany({});
  });

  it("returns null when art missing", async () => {
    const r = await getArtSalesByDateUtil({
      artikul: "missing",
      date: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(r).toBeNull();
  });

  it("returns sales for date with slice data", async () => {
    await Art.create({ artikul: "ART-1", zone: "A" });
    const d0 = new Date("2026-02-28T00:00:00.000Z");
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    await seedBtradeSliceMonthDay(d0, { "ART-1": { quantity: 10, price: 2 } });
    await seedBtradeSliceMonthDay(d1, { "ART-1": { quantity: 7, price: 2 } });

    const r = await getArtSalesByDateUtil({
      artikul: "ART-1",
      date: d1,
    });

    expect(r).not.toBeNull();
    expect(r!.sales).toBe(3);
    expect(r!.revenue).toBe(6);
  });
});
