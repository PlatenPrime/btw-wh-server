import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsByArtikulController } from "../get-analogs-by-artikul/getAnalogsByArtikulController.js";
describe("getAnalogsByArtikulController", () => {
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
    it("400 when artikul empty", async () => {
        const req = { params: { artikul: "" } };
        await getAnalogsByArtikulController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns analogs for artikul", async () => {
        await Analog.create([
            { konkName: "k1", prodName: "p", url: "https://a.com", artikul: "ART-1" },
            { konkName: "k2", prodName: "p", url: "https://b.com", artikul: "ART-1" },
        ]);
        const req = { params: { artikul: "ART-1" } };
        await getAnalogsByArtikulController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(2);
    });
});
