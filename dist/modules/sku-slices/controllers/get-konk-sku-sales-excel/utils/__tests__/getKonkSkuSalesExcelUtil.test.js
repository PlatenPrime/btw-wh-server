import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkSkuSalesExcelUtil } from "../getKonkSkuSalesExcelUtil.js";
describe("getKonkSkuSalesExcelUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    it("returns ok false when no skus for konk/prod", async () => {
        const result = await getKonkSkuSalesExcelUtil({
            konk: "air",
            prod: "gemar",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-01T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("returns ok false when prod does not match skus", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-sales-wrong-prod",
            title: "A",
            url: "https://e.com/a",
        });
        const result = await getKonkSkuSalesExcelUtil({
            konk: "air",
            prod: "other",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-01T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("builds excel for multiple skus of one konk", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-sales-k-1",
            title: "A",
            url: "https://e.com/a",
        });
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-sales-k-2",
            title: "B",
            url: "https://e.com/b",
        });
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        const d2 = new Date("2026-03-02T00:00:00.000Z");
        await SkuSlice.insertMany([
            {
                konkName: "air",
                date: d1,
                data: {
                    "air-sales-k-1": { stock: 5, price: 3 },
                    "air-sales-k-2": { stock: 7, price: 4 },
                },
            },
            {
                konkName: "air",
                date: d2,
                data: {
                    "air-sales-k-1": { stock: 4, price: 3 },
                    "air-sales-k-2": { stock: 2, price: 4 },
                },
            },
        ]);
        const result = await getKonkSkuSalesExcelUtil({
            konk: "air",
            prod: "gemar",
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.buffer.length).toBeGreaterThan(200);
            expect(result.fileName).toContain("sku_sales_konk");
            expect(result.fileName).toContain("air");
            expect(result.fileName).toContain("gemar");
        }
    });
});
