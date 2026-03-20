import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { updateSkuByIdController } from "../update-sku-by-id/updateSkuByIdController.js";
describe("updateSkuByIdController", () => {
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
        const req = {
            params: { id: "bad-id" },
            body: { title: "New" },
        };
        await updateSkuByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 updates sku", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            title: "Old",
            url: "https://k1.com/old-update",
        });
        const req = {
            params: { id: sku._id.toString() },
            body: { title: "New" },
        };
        await updateSkuByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New");
    });
});
