import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../arts/models/Art.js";
import { Analog } from "../../models/Analog.js";
import { createAnalogController } from "../create-analog/createAnalogController.js";
describe("createAnalogController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Analog.deleteMany({});
        await Art.deleteMany({});
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
    it("400 when body missing required fields", async () => {
        const req = { body: { konkName: "k" } };
        await createAnalogController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when no artikul provided", async () => {
        const req = {
            body: {
                konkName: "k",
                prodName: "p",
                url: "https://x.com",
            },
        };
        await createAnalogController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates analog with artikul and pulls nameukr from Art", async () => {
        await Art.create({
            artikul: "ART-1",
            nameukr: "Назва",
            zone: "A1",
        });
        const req = {
            body: {
                konkName: "k",
                prodName: "p",
                url: "https://x.com",
                artikul: "ART-1",
            },
        };
        await createAnalogController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.nameukr).toBe("Назва");
    });
    it("409 when creating analog with duplicate url", async () => {
        const req1 = {
            body: {
                konkName: "k1",
                prodName: "p",
                url: "https://same-url.com/page",
                artikul: "ART-1",
            },
        };
        await createAnalogController(req1, res);
        expect(responseStatus.code).toBe(201);
        const req2 = {
            body: {
                konkName: "k2",
                prodName: "p",
                url: "https://same-url.com/page",
                artikul: "ART-2",
            },
        };
        await createAnalogController(req2, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Analog with this url already exists");
        const count = await Analog.countDocuments();
        expect(count).toBe(1);
    });
});
