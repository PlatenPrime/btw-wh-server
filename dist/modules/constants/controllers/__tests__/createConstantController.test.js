import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { createConstantController } from "../create-constant/createConstantController.js";
describe("createConstantController", () => {
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
    it("400 when name missing", async () => {
        const req = {
            body: {
                title: "Title",
                data: {},
            },
        };
        await createConstantController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when name contains spaces", async () => {
        const req = {
            body: {
                name: "my key",
                title: "My Key",
                data: {},
            },
        };
        await createConstantController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates constant and returns data", async () => {
        const req = {
            body: {
                name: "config",
                title: "Config",
                data: { foo: "bar" },
            },
        };
        await createConstantController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.name).toBe("config");
        const count = await Constant.countDocuments();
        expect(count).toBe(1);
    });
});
