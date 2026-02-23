import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { getKonkByNameController } from "../get-konk-by-name/getKonkByNameController.js";
describe("getKonkByNameController", () => {
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
    it("404 when konk not found", async () => {
        const req = { params: { name: "nonexistent" } };
        await getKonkByNameController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns konk data", async () => {
        await Konk.create({
            name: "acme",
            title: "Acme",
            url: "https://acme.com",
            imageUrl: "https://acme.com/1.png",
        });
        const req = { params: { name: "acme" } };
        await getKonkByNameController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.name).toBe("acme");
    });
});
