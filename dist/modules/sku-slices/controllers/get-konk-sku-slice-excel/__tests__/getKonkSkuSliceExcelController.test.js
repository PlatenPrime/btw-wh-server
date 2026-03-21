import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getKonkSkuSliceExcelController } from "../getKonkSkuSliceExcelController.js";
describe("getKonkSkuSliceExcelController", () => {
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
        await getKonkSkuSliceExcelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when no skus for group", async () => {
        const req = {
            query: {
                konk: "air",
                prod: "nobody",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
            },
        };
        await getKonkSkuSliceExcelController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 sends excel for group", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "gemar",
            productId: "air-konk-x-1",
            title: "A",
            url: "https://e.com/a",
        });
        const d = new Date("2026-06-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date: d,
            data: { "air-konk-x-1": { stock: 2, price: 3 } },
        });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
            },
        };
        await getKonkSkuSliceExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Buffer.isBuffer(responseBody)).toBe(true);
        expect(String(responseHeaders["Content-Disposition"])).toContain("gemar");
    });
});
