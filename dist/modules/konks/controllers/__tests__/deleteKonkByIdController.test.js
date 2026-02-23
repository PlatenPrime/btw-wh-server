import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { deleteKonkByIdController } from "../delete-konk-by-id/deleteKonkByIdController.js";
describe("deleteKonkByIdController", () => {
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
        await deleteKonkByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when konk not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteKonkByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes konk", async () => {
        const konk = await Konk.create({
            name: "to-delete",
            title: "To Delete",
            url: "https://x.com",
            imageUrl: "https://x.com/1.png",
        });
        const req = { params: { id: konk._id.toString() } };
        await deleteKonkByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Konk.findById(konk._id);
        expect(found).toBeNull();
    });
});
