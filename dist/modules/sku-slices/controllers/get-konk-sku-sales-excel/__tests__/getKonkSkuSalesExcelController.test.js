import { beforeEach, describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
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
                prod: "gemar",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when sortBy is invalid", async () => {
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
                sortBy: "nope",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when prod empty", async () => {
        const req = {
            query: {
                konk: "air",
                prod: "",
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
                prod: "gemar",
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
                prod: "gemar",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-02",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Buffer.isBuffer(responseBody)).toBe(true);
        const disposition = String(responseHeaders["Content-Disposition"]);
        expect(disposition).toContain("sku_sales_konk");
        expect(disposition).toContain("gemar");
    });
    it("200 with sortBy=sales orders sku blocks by total sales desc", async () => {
        const warm = new Date("2026-06-01T00:00:00.000Z");
        const d1 = new Date("2026-06-02T00:00:00.000Z");
        const d2 = new Date("2026-06-03T00:00:00.000Z");
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "aaa-low-sales",
            title: "A",
            url: "https://e.com/a",
        });
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "zzz-high-sales",
            title: "Z",
            url: "https://e.com/z",
        });
        await SkuSlice.insertMany([
            {
                konkName: "air",
                date: warm,
                data: {
                    "aaa-low-sales": { stock: 10, price: 5 },
                    "zzz-high-sales": { stock: 100, price: 2 },
                },
            },
            {
                konkName: "air",
                date: d1,
                data: {
                    "aaa-low-sales": { stock: 9, price: 5 },
                    "zzz-high-sales": { stock: 50, price: 2 },
                },
            },
            {
                konkName: "air",
                date: d2,
                data: {
                    "aaa-low-sales": { stock: 8, price: 5 },
                    "zzz-high-sales": { stock: 40, price: 2 },
                },
            },
        ]);
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-06-02",
                dateTo: "2026-06-03",
                sortBy: "sales",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(responseBody);
        const ws = wb.getWorksheet("Продажі");
        expect(ws?.getRow(2).getCell(1).value).toBe("zzz-high-sales");
        expect(ws?.getRow(5).getCell(1).value).toBe("aaa-low-sales");
    });
    it("200 accepts prod=all and passes it to util", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "p1",
            productId: "air-all-ctrl",
            title: "A",
            url: "https://e.com/a",
        });
        const d1 = new Date("2026-06-01T00:00:00.000Z");
        const d2 = new Date("2026-06-02T00:00:00.000Z");
        await SkuSlice.insertMany([
            { konkName: "air", date: d1, data: { "air-all-ctrl": { stock: 4, price: 8 } } },
            { konkName: "air", date: d2, data: { "air-all-ctrl": { stock: 1, price: 8 } } },
        ]);
        const req = {
            query: {
                konk: "air",
                prod: "all",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-02",
            },
        };
        await getKonkSkuSalesExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Buffer.isBuffer(responseBody)).toBe(true);
        const disposition = String(responseHeaders["Content-Disposition"]);
        expect(disposition).toContain("_all_");
    });
});
