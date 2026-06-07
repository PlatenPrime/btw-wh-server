import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { fixIncorrectSkuDataController } from "../fix-incorrect-sku-data/fixIncorrectSkuDataController.js";
describe("fixIncorrectSkuDataController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
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
    it("400 when validation fails", async () => {
        const req = {
            body: { filter: {}, updates: {} },
        };
        await fixIncorrectSkuDataController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 fixes sku data", async () => {
        await Sku.create({
            konkName: "k-fix",
            prodName: "p1",
            productId: "k-fix-1",
            title: "Before",
            url: "https://k-fix.com/1",
        });
        const req = {
            body: {
                filter: { konkName: "k-fix" },
                updates: { title: "After" },
            },
        };
        await fixIncorrectSkuDataController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.modifiedCount).toBe(1);
    });
});
