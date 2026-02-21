import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { deleteProdByIdController } from "../delete-prod-by-id/deleteProdByIdController.js";
describe("deleteProdByIdController", () => {
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
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when prod not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes prod", async () => {
        const prod = await Prod.create({
            name: "to-delete",
            title: "To Delete",
            imageUrl: "https://x.com/1.png",
        });
        const req = { params: { id: prod._id.toString() } };
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Prod.findById(prod._id);
        expect(found).toBeNull();
    });
});
