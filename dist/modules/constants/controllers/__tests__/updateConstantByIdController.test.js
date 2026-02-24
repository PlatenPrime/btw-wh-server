import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { updateConstantByIdController } from "../update-constant-by-id/updateConstantByIdController.js";
describe("updateConstantByIdController", () => {
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
        const req = {
            params: { id: "invalid" },
            body: { title: "New" },
        };
        await updateConstantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when constant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { title: "New" },
        };
        await updateConstantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates and returns data", async () => {
        const constant = await Constant.create({
            name: "x",
            title: "Old",
            data: {},
        });
        const req = {
            params: { id: constant._id.toString() },
            body: { title: "New Title" },
        };
        await updateConstantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New Title");
    });
});
