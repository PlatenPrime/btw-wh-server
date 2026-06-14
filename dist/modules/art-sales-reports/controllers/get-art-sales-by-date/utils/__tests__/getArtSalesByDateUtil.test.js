import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { getArtSalesByDateUtil } from "../getArtSalesByDateUtil.js";
describe("getArtSalesByDateUtil", () => {
    beforeEach(async () => {
        await Art.deleteMany({});
        await BtradeSlice.deleteMany({});
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
        await BtradeSlice.insertMany([
            { date: d0, data: { "ART-1": { quantity: 10, price: 2 } } },
            { date: d1, data: { "ART-1": { quantity: 7, price: 2 } } },
        ]);
        const r = await getArtSalesByDateUtil({
            artikul: "ART-1",
            date: d1,
        });
        expect(r).not.toBeNull();
        expect(r.sales).toBe(3);
        expect(r.revenue).toBe(6);
    });
});
