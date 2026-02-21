import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { getProdByNameController } from "../get-prod-by-name/getProdByNameController.js";
describe("getProdByNameController", () => {
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
    it("404 when prod not found", async () => {
        const req = { params: { name: "nonexistent" } };
        await getProdByNameController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns prod data", async () => {
        await Prod.create({
            name: "acme",
            title: "Acme",
            imageUrl: "https://acme.com/1.png",
        });
        const req = { params: { name: "acme" } };
        await getProdByNameController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.name).toBe("acme");
    });
});
