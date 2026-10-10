import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSliceMonth } from "../../../../../btrade-slices/models/BtradeSliceMonth.js";
import { seedBtradeSliceMonthDay } from "../../../../../btrade-slices/utils/seedBtradeSliceMonthDay.js";
import { getArtSalesExcelUtil } from "../getArtSalesExcelUtil.js";

describe("getArtSalesExcelUtil", () => {
  beforeEach(async () => {
    await Art.deleteMany({});
    await BtradeSliceMonth.deleteMany({});
  });

  it("returns xlsx buffer for art sales", async () => {
    await Art.create({ artikul: "ART-1", zone: "A" });
    const d0 = new Date("2026-02-28T00:00:00.000Z");
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    await seedBtradeSliceMonthDay(d0, { "ART-1": { quantity: 10, price: 2 } });
    await seedBtradeSliceMonthDay(d1, { "ART-1": { quantity: 8, price: 2 } });

    const r = await getArtSalesExcelUtil({
      artikul: "ART-1",
      dateFrom: d1,
      dateTo: d1,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.buffer.length).toBeGreaterThan(0);
      expect(r.fileName).toContain("art_sales_ART-1");
    }
  });
});
