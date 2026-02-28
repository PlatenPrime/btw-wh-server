import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsByProdController } from "../get-analogs-by-prod/getAnalogsByProdController.js";
describe("getAnalogsByProdController", () => {
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
    it("400 when prodName empty", async () => {
        const req = { params: { prodName: "" } };
        await getAnalogsByProdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns analogs and pagination for prodName", async () => {
        await Analog.create([
            { konkName: "k1", prodName: "maker", url: "https://a.com" },
            { konkName: "k2", prodName: "maker", url: "https://b.com" },
        ]);
        const req = {
            params: { prodName: "maker" },
            query: {},
        };
        await getAnalogsByProdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(2);
        expect(responseJson.pagination).toBeDefined();
        expect(responseJson.pagination.total).toBe(2);
    });
});
