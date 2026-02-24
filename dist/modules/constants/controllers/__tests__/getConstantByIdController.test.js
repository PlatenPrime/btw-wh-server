import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { getConstantByIdController } from "../get-constant-by-id/getConstantByIdController.js";
describe("getConstantByIdController", () => {
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
        await getConstantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when constant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getConstantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns constant data", async () => {
        const constant = await Constant.create({
            name: "acme",
            title: "Acme",
            data: { key: "value" },
        });
        const req = { params: { id: constant._id.toString() } };
        await getConstantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.name).toBe("acme");
    });
});
