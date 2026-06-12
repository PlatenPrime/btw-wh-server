import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../arts/models/Art.js";
import { isInvalidSliceStockPriceItem } from "../../../../slices/utils/isInvalidSliceStockPriceItem.js";
import "../../../../../test/setup.js";
import { BtradeSlice } from "../../../models/BtradeSlice.js";
import { getBtradeSliceUtil } from "../utils/getBtradeSliceUtil.js";
const baseQuery = {
    page: 1,
    limit: 10,
};
describe("getBtradeSliceUtil", () => {
    beforeEach(async () => {
        await BtradeSlice.deleteMany({});
        await Art.deleteMany({});
    });
    it("returns slice when found by date", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({
            date,
            data: { "ART-1": { price: 100, quantity: 5 } },
        });
        const result = await getBtradeSliceUtil({
            ...baseQuery,
            date,
        });
        expect(result).not.toBeNull();
        expect(result.date.getTime()).toBe(date.getTime());
        expect(result.items).toEqual([
            {
                artikul: "ART-1",
                quantity: 5,
                price: 100,
                art: null,
            },
        ]);
        expect(result.pagination).toMatchObject({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
        });
    });
    it("maps artikul to Art document when present", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        const art = await Art.create({
            artikul: "ART-1",
            zone: "A",
            nameukr: "Test",
        });
        await BtradeSlice.create({
            date,
            data: { "ART-1": { price: 100, quantity: 5 } },
        });
        const result = await getBtradeSliceUtil({
            ...baseQuery,
            date,
        });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].art).not.toBeNull();
        expect(result.items[0].art._id.toString()).toBe(art._id.toString());
        expect(result.items[0].art.artikul).toBe("ART-1");
    });
    it("paginates sorted entries by artikul", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({
            date,
            data: {
                "ART-b": { price: 1, quantity: 1 },
                "ART-a": { price: 2, quantity: 2 },
                "ART-c": { price: 3, quantity: 3 },
            },
        });
        const page1 = await getBtradeSliceUtil({
            date,
            page: 1,
            limit: 2,
        });
        expect(page1.pagination.total).toBe(3);
        expect(page1.items.map((i) => i.artikul)).toEqual(["ART-a", "ART-b"]);
        const page2 = await getBtradeSliceUtil({
            date,
            page: 2,
            limit: 2,
        });
        expect(page2.items.map((i) => i.artikul)).toEqual(["ART-c"]);
        expect(page2.pagination.hasNext).toBe(false);
        expect(page2.pagination.hasPrev).toBe(true);
    });
    it("returns null when no slice for given date", async () => {
        const result = await getBtradeSliceUtil({
            ...baseQuery,
            date: new Date("2025-03-01T00:00:00.000Z"),
        });
        expect(result).toBeNull();
    });
    it("with isInvalid true returns only invalid rows and total matches filter", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({
            date,
            data: {
                "ART-ok": { price: 100, quantity: 10 },
                "ART-bad-full": { price: -1, quantity: -1 },
                "ART-bad-price": { price: -5, quantity: 1 },
            },
        });
        const result = await getBtradeSliceUtil({
            ...baseQuery,
            date,
            isInvalid: true,
        });
        expect(result).not.toBeNull();
        expect(result.pagination.total).toBe(2);
        expect(result.items.map((i) => i.artikul).sort()).toEqual([
            "ART-bad-full",
            "ART-bad-price",
        ]);
        for (const row of result.items) {
            expect(isInvalidSliceStockPriceItem(row.quantity, row.price)).toBe(true);
        }
        expect(isInvalidSliceStockPriceItem(10, 100)).toBe(false);
    });
    it("with isInvalid true and all valid entries yields total 0 and empty items", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({
            date,
            data: { "ART-1": { price: 2, quantity: 1 } },
        });
        const result = await getBtradeSliceUtil({
            ...baseQuery,
            date,
            isInvalid: true,
        });
        expect(result).not.toBeNull();
        expect(result.pagination.total).toBe(0);
        expect(result.items).toEqual([]);
    });
    it("paginates invalid-only rows by artikul", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({
            date,
            data: {
                "ART-ok": { price: 1, quantity: 1 },
                "ART-bad-b": { price: -1, quantity: -1 },
                "ART-bad-a": { quantity: 1 },
                "ART-bad-c": { price: -1, quantity: 2 },
            },
        });
        const page1 = await getBtradeSliceUtil({
            date,
            page: 1,
            limit: 2,
            isInvalid: true,
        });
        expect(page1.pagination.total).toBe(3);
        expect(page1.items.map((i) => i.artikul)).toEqual([
            "ART-bad-a",
            "ART-bad-b",
        ]);
        const page2 = await getBtradeSliceUtil({
            date,
            page: 2,
            limit: 2,
            isInvalid: true,
        });
        expect(page2.items.map((i) => i.artikul)).toEqual(["ART-bad-c"]);
    });
});
