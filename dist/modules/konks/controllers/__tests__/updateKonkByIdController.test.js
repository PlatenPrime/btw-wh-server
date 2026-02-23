import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { updateKonkByIdController } from "../update-konk-by-id/updateKonkByIdController.js";
describe("updateKonkByIdController", () => {
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
        const req = {
            params: { id: "invalid" },
            body: { title: "New" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when konk not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { title: "New" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates and returns data", async () => {
        const konk = await Konk.create({
            name: "x",
            title: "Old",
            url: "https://x.com",
            imageUrl: "https://x.com/1.png",
        });
        const req = {
            params: { id: konk._id.toString() },
            body: { title: "New Title" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New Title");
    });
});
