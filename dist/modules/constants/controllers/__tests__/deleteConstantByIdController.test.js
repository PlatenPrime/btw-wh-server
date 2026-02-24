import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { deleteConstantByIdController } from "../delete-constant-by-id/deleteConstantByIdController.js";
describe("deleteConstantByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Constant.deleteMany({});
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
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when constant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes constant", async () => {
        const constant = await Constant.create({
            name: "to-delete",
            title: "To Delete",
            data: {},
        });
        const req = { params: { id: constant._id.toString() } };
        await deleteConstantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Constant.findById(constant._id);
        expect(found).toBeNull();
    });
});
