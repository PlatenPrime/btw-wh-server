import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { getAllConstantsController } from "../get-all-constants/getAllConstantsController.js";
describe("getAllConstantsController", () => {
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
    it("200 returns empty array when no constants", async () => {
        const req = {};
        await getAllConstantsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson.data)).toBe(true);
        expect(responseJson.data.length).toBe(0);
    });
    it("200 returns list of constants", async () => {
        await Constant.create({
            name: "key1",
            title: "Title",
            data: { foo: "bar" },
        });
        const req = {};
        await getAllConstantsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(1);
        expect(responseJson.data[0].name).toBe("key1");
    });
});
