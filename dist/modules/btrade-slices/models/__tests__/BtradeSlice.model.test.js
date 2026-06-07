import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { BtradeSlice } from "../BtradeSlice.js";
describe("BtradeSlice Model", () => {
    beforeEach(async () => {
        await BtradeSlice.deleteMany({});
    });
    it("fails without required date", async () => {
        const slice = new BtradeSlice({ data: {} });
        await expect(slice.save()).rejects.toThrow();
    });
    it("saves with date and empty data", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        const saved = await BtradeSlice.create({ date, data: {} });
        expect(saved.date).toEqual(date);
        expect(saved.data).toEqual({});
        expect(saved.createdAt).toBeInstanceOf(Date);
        expect(saved.updatedAt).toBeInstanceOf(Date);
    });
    it("enforces unique date", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({ date, data: {} });
        const duplicate = new BtradeSlice({
            date,
            data: { "ART-1": { price: 1, quantity: 1 } },
        });
        await expect(duplicate.save()).rejects.toThrow();
    });
    it("stores artikul data items", async () => {
        const date = new Date("2025-03-02T00:00:00.000Z");
        const saved = await BtradeSlice.create({
            date,
            data: {
                "ART-1": { price: 100, quantity: 5 },
                "ART-2": { price: 200, quantity: 10 },
            },
        });
        expect(saved.data["ART-1"]).toEqual({ price: 100, quantity: 5 });
        expect(saved.data["ART-2"]).toEqual({ price: 200, quantity: 10 });
    });
});
