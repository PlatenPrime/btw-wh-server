import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { updateProdByIdController } from "../update-prod-by-id/updateProdByIdController.js";
describe("updateProdByIdController", () => {
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
        const req = {
            params: { id: "invalid" },
            body: { title: "New" },
        };
        await updateProdByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when prod not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { title: "New" },
        };
        await updateProdByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates and returns data", async () => {
        const prod = await Prod.create({
            name: "x",
            title: "Old",
            imageUrl: "https://x.com/1.png",
        });
        const req = {
            params: { id: prod._id.toString() },
            body: { title: "New Title" },
        };
        await updateProdByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New Title");
    });
});
