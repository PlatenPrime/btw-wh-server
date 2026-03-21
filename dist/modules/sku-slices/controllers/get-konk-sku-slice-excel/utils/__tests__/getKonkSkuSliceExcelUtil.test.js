import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkSkuSliceExcelUtil } from "../getKonkSkuSliceExcelUtil.js";
describe("getKonkSkuSliceExcelUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    it("returns ok false when no skus for konk prod", async () => {
        const r = await getKonkSkuSliceExcelUtil({
            konk: "air",
            prod: "none",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-01T00:00:00.000Z"),
        });
        expect(r.ok).toBe(false);
    });
    it("builds excel for multiple skus", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-k-1",
            title: "A",
            url: "https://e.com/a",
        });
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-k-2",
            title: "B",
            url: "https://e.com/b",
        });
        const d = new Date("2026-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date: d,
            data: {
                "air-k-1": { stock: 1, price: 2 },
                "air-k-2": { stock: 3, price: 4 },
            },
        });
        const r = await getKonkSkuSliceExcelUtil({
            konk: "air",
            prod: "gemar",
            dateFrom: d,
            dateTo: d,
        });
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.buffer.length).toBeGreaterThan(200);
            expect(r.fileName).toContain("konk");
            expect(r.fileName).toContain("air");
            expect(r.fileName).toContain("gemar");
        }
    });
});
