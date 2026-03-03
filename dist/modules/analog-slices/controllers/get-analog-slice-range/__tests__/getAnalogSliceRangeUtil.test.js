import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { getAnalogSliceRangeUtil } from "../utils/getAnalogSliceRangeUtil.js";
describe("getAnalogSliceRangeUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        await AnalogSlice.deleteMany({});
    });
    it("returns array of slice items for date range when data exists", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-range-1",
        });
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        const d2 = new Date("2026-03-02T00:00:00.000Z");
        const d3 = new Date("2026-03-03T00:00:00.000Z");
        await AnalogSlice.insertMany([
            {
                konkName: "air",
                date: d1,
                data: { "1102-0259": { stock: 0, price: 1.64 } },
            },
            {
                konkName: "air",
                date: d2,
                data: { "1102-0259": { stock: 1, price: 1.7 } },
            },
            {
                konkName: "air",
                date: d3,
                data: { "1102-0259": { stock: 2, price: 1.8 } },
            },
        ]);
        const result = await getAnalogSliceRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: d1,
            dateTo: d3,
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.data).toHaveLength(3);
            expect(result.data[0]).toEqual({
                date: d1.toISOString(),
                stock: 0,
                price: 1.64,
            });
            expect(result.data[1]).toEqual({
                date: d2.toISOString(),
                stock: 1,
                price: 1.7,
            });
            expect(result.data[2]).toEqual({
                date: d3.toISOString(),
                stock: 2,
                price: 1.8,
            });
        }
    });
    it("returns ok: false when analog not found", async () => {
        const result = await getAnalogSliceRangeUtil({
            analogId: "69a2de17f8a2a9cb9a8a75df",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-31T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("returns ok: false when analog has no artikul", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "",
            url: "https://example.com/product-no-artikul-range",
        });
        const result = await getAnalogSliceRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-31T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("returns empty data array when no slices in range", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-range-empty",
        });
        const result = await getAnalogSliceRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-31T00:00:00.000Z"),
        });
        expect(result.ok).toBe(true);
        if (result.ok)
            expect(result.data).toHaveLength(0);
    });
    it("returns only dates that have entry for artikul", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-range-partial",
        });
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        const d2 = new Date("2026-03-02T00:00:00.000Z");
        await AnalogSlice.insertMany([
            { konkName: "air", date: d1, data: {} },
            {
                konkName: "air",
                date: d2,
                data: { "1102-0259": { stock: 1, price: 1.5 } },
            },
        ]);
        const result = await getAnalogSliceRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.data).toHaveLength(1);
            expect(result.data[0].date).toBe(d2.toISOString());
            expect(result.data[0].stock).toBe(1);
            expect(result.data[0].price).toBe(1.5);
        }
    });
});
