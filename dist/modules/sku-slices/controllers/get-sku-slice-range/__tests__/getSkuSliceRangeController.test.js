import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceRangeController } from "../getSkuSliceRangeController.js";
describe("getSkuSliceRangeController", () => {
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
    it("400 when dateFrom after dateTo", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { dateFrom: "2026-03-10", dateTo: "2026-03-01" },
        };
        await getSkuSliceRangeController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when sku not found", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { dateFrom: "2026-03-01", dateTo: "2026-03-02" },
        };
        await getSkuSliceRangeController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns range items", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-range-1",
            title: "T",
            url: "https://e.com/r",
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-01T00:00:00.000Z"),
            data: { "air-range-1": { stock: 1, price: 2 } },
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-02T00:00:00.000Z"),
            data: { "air-range-1": { stock: 3, price: 2 } },
        });
        const req = {
            params: { skuId: sku._id.toString() },
            query: { dateFrom: "2026-03-01", dateTo: "2026-03-02" },
        };
        await getSkuSliceRangeController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data).toHaveLength(2);
        expect(data[0].stock).toBe(1);
        expect(data[1].stock).toBe(3);
    });
});
