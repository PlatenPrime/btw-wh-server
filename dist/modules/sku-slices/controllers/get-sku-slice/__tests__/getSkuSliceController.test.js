import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceController } from "../getSkuSliceController.js";
describe("getSkuSliceController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
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
    it("400 when query invalid", async () => {
        const req = { query: {} };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when slice missing", async () => {
        const req = {
            query: { konkName: "air", date: "2026-03-01" },
        };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns slice data", async () => {
        await SkuSlice.create({
            konkName: "air",
            date: new Date("2026-03-01T00:00:00.000Z"),
            data: { "air-1": { stock: 2, price: 5 } },
        });
        const req = {
            query: { konkName: "air", date: "2026-03-01" },
        };
        await getSkuSliceController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.konkName).toBe("air");
        expect(data.data["air-1"].stock).toBe(2);
    });
});
