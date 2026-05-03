import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
import { deleteSkusNotInAnySkugrController } from "../deleteSkusNotInAnySkugrController.js";
describe("deleteSkusNotInAnySkugrController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
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
    it("400 on invalid query", async () => {
        const req = { query: { isInvalid: "maybe" } };
        await deleteSkusNotInAnySkugrController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns deletedCount", async () => {
        await Sku.create({
            konkName: "kdn",
            prodName: "pdn",
            productId: "kdn-1",
            title: "O",
            url: "https://kdn.com/1",
        });
        const req = { query: {} };
        await deleteSkusNotInAnySkugrController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.deletedCount).toBe(1);
    });
});
