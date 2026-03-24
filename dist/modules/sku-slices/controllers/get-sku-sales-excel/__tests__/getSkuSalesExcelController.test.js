import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSalesExcelController } from "../getSkuSalesExcelController.js";
describe("getSkuSalesExcelController", () => {
    let res;
    let responseStatus;
    let responseJson;
    let responseHeaders;
    let responseBody;
    beforeEach(async () => {
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
        responseStatus = {};
        responseJson = {};
        responseHeaders = {};
        responseBody = null;
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            send(data) {
                responseBody = data;
                return this;
            },
            setHeader(name, value) {
                responseHeaders[name] = value;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 on validation error", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { dateFrom: "2026-05-10", dateTo: "2026-05-01" },
        };
        await getSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when sku not found", async () => {
        const req = {
            params: { skuId: "507f1f77bcf86cd799439011" },
            query: { dateFrom: "2026-05-01", dateTo: "2026-05-01" },
        };
        await getSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 sends xlsx buffer and headers", async () => {
        const sku = await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-sales-ctl",
            title: "Sales Item",
            url: "https://e.com/sales",
        });
        const d1 = new Date("2026-05-01T00:00:00.000Z");
        const d2 = new Date("2026-05-02T00:00:00.000Z");
        await SkuSlice.insertMany([
            { konkName: "air", date: d1, data: { "air-sales-ctl": { stock: 5, price: 10 } } },
            { konkName: "air", date: d2, data: { "air-sales-ctl": { stock: 3, price: 10 } } },
        ]);
        const req = {
            params: { skuId: sku._id.toString() },
            query: { dateFrom: "2026-05-01", dateTo: "2026-05-02" },
        };
        await getSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseHeaders["Content-Type"]).toContain("spreadsheetml");
        expect(String(responseHeaders["Content-Disposition"])).toContain("attachment");
        expect(Buffer.isBuffer(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(100);
    });
});
