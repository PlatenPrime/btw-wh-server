import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../models/Kask.js";
import { deleteKaskById } from "../delete-kask-by-id/deleteKaskById.js";
describe("deleteKaskById", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Kask.deleteMany({});
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
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when kask not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Kask not found");
    });
    it("200 deletes kask and returns artikul", async () => {
        const kask = await Kask.create({
            artikul: "5555-5555",
            nameukr: "To delete",
            zone: "A1",
        });
        const req = { params: { id: String(kask._id) } };
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Kask deleted successfully");
        expect(responseJson.data.artikul).toBe("5555-5555");
        const found = await Kask.findById(kask._id);
        expect(found).toBeNull();
    });
});
