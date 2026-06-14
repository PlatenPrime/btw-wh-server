import { describe, expect, it } from "vitest";
import { coalesceBtradeSliceItemsAlongDates, isValidBtradeSliceMetricValue, } from "../coalesceBtradeSliceItemsForReporting.js";
describe("coalesceBtradeSliceItemsForReporting", () => {
    it("isValidBtradeSliceMetricValue rejects -1 and non-numbers", () => {
        expect(isValidBtradeSliceMetricValue(-1)).toBe(false);
        expect(isValidBtradeSliceMetricValue(null)).toBe(false);
        expect(isValidBtradeSliceMetricValue(5)).toBe(true);
    });
    it("forward-fills quantity and price skipping -1", () => {
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        const d2 = new Date("2026-03-02T00:00:00.000Z");
        const d3 = new Date("2026-03-03T00:00:00.000Z");
        const out = coalesceBtradeSliceItemsAlongDates([d1, d2, d3], (d) => {
            const t = d.getTime();
            if (t === d1.getTime())
                return { quantity: 10, price: 100 };
            if (t === d2.getTime())
                return { quantity: -1, price: -1 };
            if (t === d3.getTime())
                return { quantity: 8, price: 120 };
            return undefined;
        });
        expect(out[0]).toEqual({ quantity: 10, price: 100 });
        expect(out[1]).toEqual({ quantity: 10, price: 100 });
        expect(out[2]).toEqual({ quantity: 8, price: 120 });
    });
});
