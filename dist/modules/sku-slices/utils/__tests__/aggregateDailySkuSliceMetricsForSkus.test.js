import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../models/SkuSlice.js";
import { aggregateDailySkuSliceMetricsForSkus } from "../aggregateDailySkuSliceMetricsForSkus.js";
describe("aggregateDailySkuSliceMetricsForSkus", () => {
    beforeEach(async () => {
        await SkuSlice.deleteMany({});
    });
    it("treats -1 as carry-forward so sales are zero when stock is frozen", async () => {
        const d0 = new Date("2026-04-01T00:00:00.000Z");
        const d1 = new Date("2026-04-02T00:00:00.000Z");
        const d2 = new Date("2026-04-03T00:00:00.000Z");
        await SkuSlice.insertMany([
            {
                konkName: "k",
                date: d0,
                data: { "k-a": { stock: 10, price: 5 } },
            },
            {
                konkName: "k",
                date: d1,
                data: { "k-a": { stock: -1, price: -1 } },
            },
            {
                konkName: "k",
                date: d2,
                data: { "k-a": { stock: -1, price: -1 } },
            },
        ]);
        const r = await aggregateDailySkuSliceMetricsForSkus([{ konkName: "k", productId: "k-a" }], d1, d2);
        expect(r.ok).toBe(true);
        if (!r.ok)
            return;
        expect(r.data).toHaveLength(2);
        expect(r.data[0].sales).toBe(0);
        expect(r.data[0].revenue).toBe(0);
        expect(r.data[1].sales).toBe(0);
        expect(r.data[1].revenue).toBe(0);
        expect(r.data[0].stock).toBe(10);
        expect(r.data[1].stock).toBe(10);
    });
});
