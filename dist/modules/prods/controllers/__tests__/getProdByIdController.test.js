import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { getProdByIdController } from "../get-prod-by-id/getProdByIdController.js";
describe("getProdByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Prod.deleteMany({});
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
    it("400 when id invalid", async () => {
        const req = { params: { id: "invalid" } };
        await getProdByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when prod not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getProdByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns prod data", async () => {
        const prod = await Prod.create({
            name: "acme",
            title: "Acme",
            imageUrl: "https://acme.com/1.png",
        });
        const req = { params: { id: prod._id.toString() } };
        await getProdByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.name).toBe("acme");
    });
});
