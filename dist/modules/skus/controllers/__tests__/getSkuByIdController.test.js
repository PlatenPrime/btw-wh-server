import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../models/Sku.js";
import { getSkuByIdController } from "../get-sku-by-id/getSkuByIdController.js";
describe("getSkuByIdController", () => {
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
    it("200 includes skugrs for groups containing sku", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-1",
            title: "T",
            url: "https://k1.com/u",
        });
        await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "G",
            url: "https://k1.com/g",
            skus: [sku._id],
        });
        const req = { params: { id: sku._id.toString() } };
        await getSkuByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.skugrs).toHaveLength(1);
        expect(data.skugrs[0].title).toBe("G");
    });
});
