import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { getAnalogSalesRangeUtil } from "../utils/getAnalogSalesRangeUtil.js";
describe("getAnalogSalesRangeUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        await AnalogSlice.deleteMany({});
    });
    it("returns ok: false when analog not found", async () => {
        const result = await getAnalogSalesRangeUtil({
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
        const result = await getAnalogSalesRangeUtil({
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
        const result = await getAnalogSalesRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-31T00:00:00.000Z"),
        });
        expect(result.ok).toBe(true);
        if (result.ok)
            expect(result.data).toHaveLength(0);
    });
    it("returns sales and revenue per day for date range", async () => {
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
                data: { "1102-0259": { stock: 10, price: 1.5 } },
            },
            {
                konkName: "air",
                date: d2,
                data: { "1102-0259": { stock: 7, price: 1.7 } },
            },
            {
                konkName: "air",
                date: d3,
                data: { "1102-0259": { stock: 5, price: 1.8 } },
            },
        ]);
        const result = await getAnalogSalesRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: d1,
            dateTo: d3,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.data).toHaveLength(3);
        expect(result.data[0]).toMatchObject({
            date: d1.toISOString(),
            sales: 0,
            revenue: 0,
            price: 1.5,
            isDeliveryDay: false,
        });
        expect(result.data[1]).toMatchObject({
            date: d2.toISOString(),
            sales: 3,
            revenue: 3 * 1.7,
            price: 1.7,
            isDeliveryDay: false,
        });
        expect(result.data[2]).toMatchObject({
            date: d3.toISOString(),
            sales: 2,
            revenue: 2 * 1.8,
            price: 1.8,
            isDeliveryDay: false,
        });
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
        const result = await getAnalogSalesRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.data).toHaveLength(1);
        expect(result.data[0].date).toBe(d2.toISOString());
        expect(result.data[0].sales).toBe(0);
        expect(result.data[0].revenue).toBe(0);
        expect(result.data[0].price).toBe(1.5);
    });
    it("sets isDeliveryDay true when stock increased vs previous day", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-range-delivery",
        });
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        const d2 = new Date("2026-03-02T00:00:00.000Z");
        await AnalogSlice.insertMany([
            {
                konkName: "air",
                date: d1,
                data: { "1102-0259": { stock: 5, price: 1 } },
            },
            {
                konkName: "air",
                date: d2,
                data: { "1102-0259": { stock: 10, price: 1.5 } },
            },
        ]);
        const result = await getAnalogSalesRangeUtil({
            analogId: analog._id.toString(),
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.data[0].isDeliveryDay).toBe(false);
        expect(result.data[1].isDeliveryDay).toBe(true);
        expect(result.data[1].sales).toBe(0);
        expect(result.data[1].revenue).toBe(0);
    });
});
