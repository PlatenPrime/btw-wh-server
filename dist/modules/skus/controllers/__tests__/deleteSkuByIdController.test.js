import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { deleteSkuByIdController } from "../delete-sku-by-id/deleteSkuByIdController.js";
describe("deleteSkuByIdController", () => {
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
        await deleteSkuByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 deletes sku", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-5",
            title: "To delete",
            url: "https://k1.com/to-delete",
        });
        const req = { params: { id: sku._id.toString() } };
        await deleteSkuByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Sku deleted successfully");
    });
});
