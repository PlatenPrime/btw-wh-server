import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getKonkSkuSalesExcelController } from "../getKonkSkuSalesExcelController.js";
describe("getKonkSkuSalesExcelController", () => {
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
    it("400 when konk empty", async () => {
        const req = {
            query: {
                konk: "",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when no skus for konk", async () => {
        const req = {
            query: {
                konk: "air",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 sends excel for konk", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-konk-sales-1",
            title: "A",
            url: "https://e.com/a",
        });
        const d1 = new Date("2026-06-01T00:00:00.000Z");
        const d2 = new Date("2026-06-02T00:00:00.000Z");
        await SkuSlice.insertMany([
            { konkName: "air", date: d1, data: { "air-konk-sales-1": { stock: 4, price: 8 } } },
            { konkName: "air", date: d2, data: { "air-konk-sales-1": { stock: 1, price: 8 } } },
        ]);
        const req = {
            query: {
                konk: "air",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-02",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Buffer.isBuffer(responseBody)).toBe(true);
        expect(String(responseHeaders["Content-Disposition"])).toContain("sku_sales_konk");
    });
});
