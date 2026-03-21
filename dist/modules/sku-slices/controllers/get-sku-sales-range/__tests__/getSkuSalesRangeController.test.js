import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSalesRangeController } from "../getSkuSalesRangeController.js";
describe("getSkuSalesRangeController", () => {
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
    it("400 when dates invalid order", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { dateFrom: "2026-04-02", dateTo: "2026-04-01" },
        };
        await getSkuSalesRangeController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when sku missing", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { dateFrom: "2026-04-01", dateTo: "2026-04-02" },
        };
        await getSkuSalesRangeController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns sales range", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-srange-1",
            title: "T",
            url: "https://e.com/sr",
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-04-01T00:00:00.000Z"),
            data: { "air-srange-1": { stock: 5, price: 3 } },
        });
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-04-02T00:00:00.000Z"),
            data: { "air-srange-1": { stock: 4, price: 3 } },
        });
        const req = {
            params: { skuId: sku._id.toString() },
            query: { dateFrom: "2026-04-01", dateTo: "2026-04-02" },
        };
        await getSkuSalesRangeController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data).toHaveLength(2);
    });
});
