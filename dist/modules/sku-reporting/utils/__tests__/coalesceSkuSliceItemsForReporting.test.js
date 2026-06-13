import { describe, expect, it } from "vitest";
import { coalesceSkuSliceItemsAlongDates, isValidSkuSliceMetricValue, sliceDateMinusDays, } from "../coalesceSkuSliceItemsForReporting.js";
describe("isValidSkuSliceMetricValue", () => {
    it("rejects -1 and non-finite", () => {
        expect(isValidSkuSliceMetricValue(-1)).toBe(false);
        expect(isValidSkuSliceMetricValue(NaN)).toBe(false);
        expect(isValidSkuSliceMetricValue(Infinity)).toBe(false);
        expect(isValidSkuSliceMetricValue("1")).toBe(false);
        expect(isValidSkuSliceMetricValue(null)).toBe(false);
    });
    it("accepts normal numbers including 0", () => {
        expect(isValidSkuSliceMetricValue(0)).toBe(true);
        expect(isValidSkuSliceMetricValue(10)).toBe(true);
        expect(isValidSkuSliceMetricValue(3.5)).toBe(true);
    });
});
describe("sliceDateMinusDays", () => {
    it("subtracts UTC days", () => {
        const d = new Date("2025-04-03T00:00:00.000Z");
        const prev = sliceDateMinusDays(d, 1);
        expect(prev.toISOString()).toBe("2025-04-02T00:00:00.000Z");
    });
});
describe("coalesceSkuSliceItemsAlongDates", () => {
    const d0 = new Date("2025-04-01T00:00:00.000Z");
    const d1 = new Date("2025-04-02T00:00:00.000Z");
    const d2 = new Date("2025-04-03T00:00:00.000Z");
    const d3 = new Date("2025-04-04T00:00:00.000Z");
    it("carries stock and price left when -1 appears", () => {
        const map = new Map([
            [d0.getTime(), { stock: 100, price: 50 }],
            [d1.getTime(), { stock: -1, price: -1 }],
            [d2.getTime(), { stock: -1, price: -1 }],
        ]);
        const r = coalesceSkuSliceItemsAlongDates([d0, d1, d2], (d) => map.get(d.getTime()));
        expect(r[0]).toEqual({ stock: 100, price: 50 });
        expect(r[1]).toEqual({ stock: 100, price: 50 });
        expect(r[2]).toEqual({ stock: 100, price: 50 });
    });
    it("updates fields independently", () => {
        const map = new Map([
            [d0.getTime(), { stock: 10, price: 20 }],
            [d1.getTime(), { stock: 5, price: -1 }],
        ]);
        const r = coalesceSkuSliceItemsAlongDates([d0, d1], (d) => map.get(d.getTime()));
        expect(r[1]).toEqual({ stock: 5, price: 20 });
    });
    it("uses initial carry for leading gaps", () => {
        const map = new Map([
            [d1.getTime(), { stock: -1, price: -1 }],
        ]);
        const r = coalesceSkuSliceItemsAlongDates([d0, d1], (d) => map.get(d.getTime()), { lastStock: 7, lastPrice: 8 });
        expect(r[0]).toEqual({ stock: 7, price: 8 });
        expect(r[1]).toEqual({ stock: 7, price: 8 });
    });
    it("returns null until first valid sample", () => {
        const map = new Map([
            [d2.getTime(), { stock: 1, price: 2 }],
        ]);
        const r = coalesceSkuSliceItemsAlongDates([d0, d1, d2, d3], (d) => map.get(d.getTime()));
        expect(r[0]).toEqual({ stock: null, price: null });
        expect(r[1]).toEqual({ stock: null, price: null });
        expect(r[2]).toEqual({ stock: 1, price: 2 });
        expect(r[3]).toEqual({ stock: 1, price: 2 });
    });
});
