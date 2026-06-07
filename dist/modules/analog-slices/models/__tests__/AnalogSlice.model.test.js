import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { AnalogSlice } from "../AnalogSlice.js";
describe("AnalogSlice Model", () => {
    beforeEach(async () => {
        await AnalogSlice.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required konkName", async () => {
            const slice = new AnalogSlice({
                date: new Date("2026-03-01T00:00:00.000Z"),
                data: {},
            });
            await expect(slice.save()).rejects.toThrow();
        });
        it("should fail without required date", async () => {
            const slice = new AnalogSlice({
                konkName: "air",
                data: {},
            });
            await expect(slice.save()).rejects.toThrow();
        });
        it("should save with required fields and default empty data", async () => {
            const date = new Date("2026-03-01T00:00:00.000Z");
            const saved = await AnalogSlice.create({
                konkName: "air",
                date,
            });
            expect(saved.konkName).toBe("air");
            expect(saved.date).toEqual(date);
            expect(saved.data).toEqual({});
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should save slice data items with stock and price", async () => {
            const saved = await AnalogSlice.create({
                konkName: "air",
                date: new Date("2026-03-01T00:00:00.000Z"),
                data: {
                    "1102-0259": { stock: 10, price: 1.64, artikul: "1102-0259" },
                },
            });
            expect(saved.data["1102-0259"]).toEqual({
                stock: 10,
                price: 1.64,
                artikul: "1102-0259",
            });
        });
        it("should enforce unique konkName + date index", async () => {
            const date = new Date("2026-03-01T00:00:00.000Z");
            await AnalogSlice.create({ konkName: "air", date, data: {} });
            const duplicate = new AnalogSlice({
                konkName: "air",
                date,
                data: { other: { stock: 1, price: 2 } },
            });
            await expect(duplicate.save()).rejects.toThrow();
        });
    });
});
