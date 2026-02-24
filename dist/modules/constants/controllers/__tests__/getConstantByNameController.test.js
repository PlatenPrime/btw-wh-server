import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { getConstantByNameController } from "../get-constant-by-name/getConstantByNameController.js";
describe("getConstantByNameController", () => {
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
    it("404 when constant not found", async () => {
        const req = { params: { name: "nonexistent" } };
        await getConstantByNameController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns constant data", async () => {
        await Constant.create({
            name: "acme",
            title: "Acme",
            data: { key: "value" },
        });
        const req = { params: { name: "acme" } };
        await getConstantByNameController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.name).toBe("acme");
    });
});
