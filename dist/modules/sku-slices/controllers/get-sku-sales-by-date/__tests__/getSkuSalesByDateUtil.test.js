import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSalesByDateUtil } from "../utils/getSkuSalesByDateUtil.js";
describe("getSkuSalesByDateUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    it("returns null when sku not found", async () => {
        expect(await getSkuSalesByDateUtil({
            skuId: "69a2de17f8a2a9cb9a8a75df",
            date: new Date("2026-03-01T00:00:00.000Z"),
        })).toBeNull();
    });
    it("returns null when no slice for date", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-s1",
            title: "T",
            url: "https://example.com/s1",
        });
        expect(await getSkuSalesByDateUtil({
            skuId: sku._id.toString(),
            date: new Date("2026-03-01T00:00:00.000Z"),
        })).toBeNull();
    });
    it("computes sales from prev and curr day slices", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-s2",
            title: "T",
            url: "https://example.com/s2",
        });
        const prevDate = new Date("2026-02-28T00:00:00.000Z");
        const currDate = new Date("2026-03-01T00:00:00.000Z");
        await SkuSlice.insertMany([
            {
                konkName: "air",
                date: prevDate,
                data: { "air-s2": { stock: 10, price: 5 } },
            },
            {
                konkName: "air",
                date: currDate,
                data: { "air-s2": { stock: 7, price: 5 } },
            },
        ]);
        const result = await getSkuSalesByDateUtil({
            skuId: sku._id.toString(),
            date: currDate,
        });
        expect(result).not.toBeNull();
        expect(result.sales).toBe(3);
        expect(result.price).toBe(5);
        expect(result.revenue).toBe(15);
        expect(typeof result.isDeliveryDay).toBe("boolean");
    });
});
