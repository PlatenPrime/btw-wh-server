import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsController } from "../get-analogs/getAnalogsController.js";
describe("getAnalogsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Analog.deleteMany({});
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
    it("200 returns analogs with pagination", async () => {
        await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const req = { query: { page: "1", limit: "10" } };
        await getAnalogsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson.data)).toBe(true);
        expect(responseJson.pagination).toBeDefined();
        expect(responseJson.pagination.total).toBe(1);
    });
    it("400 when query invalid", async () => {
        const req = { query: { page: "-1" } };
        await getAnalogsController(req, res);
        expect(responseStatus.code).toBe(400);
    });
});
