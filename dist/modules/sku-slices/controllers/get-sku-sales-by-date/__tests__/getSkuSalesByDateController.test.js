import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSalesByDateController } from "../getSkuSalesByDateController.js";
describe("getSkuSalesByDateController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 when date invalid", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { date: "not-a-date" },
        };
        await getSkuSalesByDateController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when no slice for date", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-sales-1",
            title: "T",
            url: "https://e.com/s",
        });
        const req = {
            params: { skuId: sku._id.toString() },
            query: { date: "2026-03-05" },
        };
        await getSkuSalesByDateController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns sales payload", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-sales-2",
            title: "T",
            url: "https://e.com/s2",
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-04T00:00:00.000Z"),
            data: { "air-sales-2": { stock: 10, price: 2 } },
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-05T00:00:00.000Z"),
            data: { "air-sales-2": { stock: 8, price: 2 } },
        });
        const req = {
            params: { skuId: sku._id.toString() },
            query: { date: "2026-03-05" },
        };
        await getSkuSalesByDateController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.price).toBe(2);
        expect(typeof data.sales).toBe("number");
        expect(typeof data.revenue).toBe("number");
    });
});
