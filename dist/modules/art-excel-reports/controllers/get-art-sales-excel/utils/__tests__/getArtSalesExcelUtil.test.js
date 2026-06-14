import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getArtSalesExcelUtil } from "../getArtSalesExcelUtil.js";
describe("getArtSalesExcelUtil", () => {
    beforeEach(async () => {
        await Art.deleteMany({});
        await BtradeSlice.deleteMany({});
    });
    it("returns xlsx buffer for art sales", async () => {
        await Art.create({ artikul: "ART-1", zone: "A" });
        const d0 = new Date("2026-02-28T00:00:00.000Z");
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        await BtradeSlice.insertMany([
            { date: d0, data: { "ART-1": { quantity: 10, price: 2 } } },
            { date: d1, data: { "ART-1": { quantity: 8, price: 2 } } },
        ]);
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
