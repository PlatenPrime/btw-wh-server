import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { getSkuByIdController } from "../get-sku-by-id/getSkuByIdController.js";
describe("getSkuByIdController", () => {
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
    it("400 for invalid id", async () => {
        const req = { params: { id: "bad-id" } };
        await getSkuByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when sku not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getSkuByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
});
