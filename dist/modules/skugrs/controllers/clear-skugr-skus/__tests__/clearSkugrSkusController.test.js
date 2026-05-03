import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
import { clearSkugrSkusController } from "../clearSkugrSkusController.js";
describe("clearSkugrSkusController", () => {
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
    it("400 on invalid id", async () => {
        const req = { params: { id: "bad" } };
        await clearSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when missing", async () => {
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
        };
        await clearSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 clears skus", async () => {
        const sku = await Sku.create({
            konkName: "kcc",
            prodName: "pcc",
            productId: "kcc-1",
            title: "S",
            url: "https://kcc.com/1",
        });
        const g = await Skugr.create({
            konkName: "kcc",
            prodName: "pcc",
            title: "G",
            url: "https://kcc.com/g",
            skus: [sku._id],
        });
        const req = { params: { id: g._id.toString() } };
        await clearSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.skus).toHaveLength(0);
    });
});
