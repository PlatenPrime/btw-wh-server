import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../analogs/models/Analog.js";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { getAnalogSliceByDateUtil } from "../utils/getAnalogSliceByDateUtil.js";
describe("getAnalogSliceByDateUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        await AnalogSlice.deleteMany({});
    });
    it("returns stock and price when analog and slice exist for date", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-1",
        });
        const date = new Date("2026-03-01T00:00:00.000Z");
        await AnalogSlice.create({
            konkName: "air",
            date,
            data: {
                "1102-0259": { stock: 0, price: 1.64, artikul: "1102-0259" },
            },
        });
        const result = await getAnalogSliceByDateUtil({
            analogId: analog._id.toString(),
            date,
        });
        expect(result).toEqual({ stock: 0, price: 1.64 });
    });
    it("returns null when analog not found", async () => {
        const date = new Date("2026-03-01T00:00:00.000Z");
        const result = await getAnalogSliceByDateUtil({
            analogId: "69a2de17f8a2a9cb9a8a75df",
            date,
        });
        expect(result).toBeNull();
    });
    it("returns null when analog has no artikul", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "",
            url: "https://example.com/product-no-artikul",
        });
        const date = new Date("2026-03-01T00:00:00.000Z");
        const result = await getAnalogSliceByDateUtil({
            analogId: analog._id.toString(),
            date,
        });
        expect(result).toBeNull();
    });
    it("returns null when no slice for date", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-2",
        });
        const result = await getAnalogSliceByDateUtil({
            analogId: analog._id.toString(),
            date: new Date("2026-03-01T00:00:00.000Z"),
        });
        expect(result).toBeNull();
    });
    it("returns null when slice exists but no entry for artikul", async () => {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul: "1102-0259",
            url: "https://example.com/product-3",
        });
        const date = new Date("2026-03-01T00:00:00.000Z");
        await AnalogSlice.create({
            konkName: "air",
            date,
            data: { "other-artikul": { stock: 1, price: 2 } },
        });
        const result = await getAnalogSliceByDateUtil({
            analogId: analog._id.toString(),
            date,
        });
        expect(result).toBeNull();
    });
});
