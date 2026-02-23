import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { getKonkByIdController } from "../get-konk-by-id/getKonkByIdController.js";
describe("getKonkByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Konk.deleteMany({});
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
        await getKonkByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when konk not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getKonkByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns konk data", async () => {
        const konk = await Konk.create({
            name: "acme",
            title: "Acme",
            url: "https://acme.com",
            imageUrl: "https://acme.com/1.png",
        });
        const req = { params: { id: konk._id.toString() } };
        await getKonkByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.name).toBe("acme");
    });
});
