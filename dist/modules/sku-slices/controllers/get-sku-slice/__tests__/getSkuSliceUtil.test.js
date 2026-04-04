import { beforeEach, describe, expect, it } from "vitest";
import { shouldRefetchSkuSliceItem } from "../../../../slice-compensation/utils/shouldRefetchSkuSliceItem.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceUtil } from "../utils/getSkuSliceUtil.js";
const baseQuery = {
    page: 1,
    limit: 10,
};
describe("getSkuSliceUtil", () => {
    beforeEach(async () => {
        await SkuSlice.deleteMany({});
        await Sku.deleteMany({});
    });
    it("returns slice when found by konkName and date", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date,
            data: { "air-1": { stock: 10, price: 100 } },
        });
        const result = await getSkuSliceUtil({
            ...baseQuery,
            konkName: "air",
            date: new Date("2025-03-01T15:00:00.000Z"),
        });
        expect(result).not.toBeNull();
        expect(result.konkName).toBe("air");
        expect(result.date.getTime()).toBe(date.getTime());
        expect(result.items).toEqual([
            {
                productId: "air-1",
                stock: 10,
                price: 100,
                sku: null,
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
    it("maps productId to Sku document when present", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-1",
            title: "T",
            url: "https://example.com/p1",
        });
        await SkuSlice.create({
            konkName: "air",
            date,
            data: { "air-1": { stock: 2, price: 5 } },
        });
        const result = await getSkuSliceUtil({
            ...baseQuery,
            konkName: "air",
            date,
        });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].sku).not.toBeNull();
        expect(result.items[0].sku._id.toString()).toBe(sku._id.toString());
        expect(result.items[0].sku.productId).toBe("air-1");
    });
    it("paginates sorted entries by productId", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date,
            data: {
                "air-b": { stock: 1, price: 1 },
                "air-a": { stock: 2, price: 2 },
                "air-c": { stock: 3, price: 3 },
            },
        });
        const page1 = await getSkuSliceUtil({
            konkName: "air",
            date,
            page: 1,
            limit: 2,
        });
        expect(page1.pagination.total).toBe(3);
        expect(page1.items.map((i) => i.productId)).toEqual(["air-a", "air-b"]);
        const page2 = await getSkuSliceUtil({
            konkName: "air",
            date,
            page: 2,
            limit: 2,
        });
        expect(page2.items.map((i) => i.productId)).toEqual(["air-c"]);
        expect(page2.pagination.hasNext).toBe(false);
        expect(page2.pagination.hasPrev).toBe(true);
    });
    it("returns null when no slice for given konkName and date", async () => {
        const result = await getSkuSliceUtil({
            ...baseQuery,
            konkName: "air",
            date: new Date("2025-03-01T00:00:00.000Z"),
        });
        expect(result).toBeNull();
    });
    it("with isInvalid true returns only refetch-like rows and total matches filter", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date,
            data: {
                "air-ok": { stock: 10, price: 100 },
                "air-bad-full": { stock: -1, price: -1 },
                "air-bad-price": { stock: 1, price: -5 },
            },
        });
        const result = await getSkuSliceUtil({
            ...baseQuery,
            konkName: "air",
            date,
            isInvalid: true,
        });
        expect(result).not.toBeNull();
        expect(result.pagination.total).toBe(2);
        expect(result.items.map((i) => i.productId).sort()).toEqual([
            "air-bad-full",
            "air-bad-price",
        ]);
        for (const row of result.items) {
            expect(shouldRefetchSkuSliceItem({ stock: row.stock, price: row.price })).toBe(true);
        }
        expect(shouldRefetchSkuSliceItem({ stock: 10, price: 100 })).toBe(false);
    });
    it("with isInvalid true and all valid entries yields total 0 and empty items", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date,
            data: { "air-1": { stock: 1, price: 2 } },
        });
        const result = await getSkuSliceUtil({
            ...baseQuery,
            konkName: "air",
            date,
            isInvalid: true,
        });
        expect(result).not.toBeNull();
        expect(result.pagination.total).toBe(0);
        expect(result.items).toEqual([]);
    });
    it("paginates invalid-only rows by productId", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date,
            data: {
                "air-ok": { stock: 1, price: 1 },
                "air-bad-b": { stock: -1, price: -1 },
                "air-bad-a": { stock: 1 },
                "air-bad-c": { stock: 2, price: -1 },
            },
        });
        const page1 = await getSkuSliceUtil({
            konkName: "air",
            date,
            page: 1,
            limit: 2,
            isInvalid: true,
        });
        expect(page1.pagination.total).toBe(3);
        expect(page1.items.map((i) => i.productId)).toEqual([
            "air-bad-a",
            "air-bad-b",
        ]);
        const page2 = await getSkuSliceUtil({
            konkName: "air",
            date,
            page: 2,
            limit: 2,
            isInvalid: true,
        });
        expect(page2.items.map((i) => i.productId)).toEqual(["air-bad-c"]);
    });
});
