import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsByKonkController } from "../get-analogs-by-konk/getAnalogsByKonkController.js";
describe("getAnalogsByKonkController", () => {
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
    it("400 when konkName empty", async () => {
        const req = { params: { konkName: "" } };
        await getAnalogsByKonkController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns analogs for konkName", async () => {
        await Analog.create([
            { konkName: "acme", prodName: "p1", url: "https://a.com" },
            { konkName: "acme", prodName: "p2", url: "https://b.com" },
        ]);
        const req = { params: { konkName: "acme" } };
        await getAnalogsByKonkController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.length).toBe(2);
    });
});
