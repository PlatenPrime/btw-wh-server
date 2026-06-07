import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../models/Kask.js";
import { updateKaskById } from "../update-kask-by-id/updateKaskById.js";
describe("updateKaskById", () => {
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
        const req = {
            params: { id: "invalid" },
            body: { zone: "B2" },
        };
        await updateKaskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400 when body empty", async () => {
        const kask = await Kask.create({
            artikul: "1234-5678",
            nameukr: "Товар",
            zone: "A1",
        });
        const req = {
            params: { id: String(kask._id) },
            body: {},
        };
        await updateKaskById(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when kask not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { zone: "B2" },
        };
        await updateKaskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Kask not found");
    });
    it("200 updates and returns data", async () => {
        const kask = await Kask.create({
            artikul: "1234-5678",
            nameukr: "Старе",
            zone: "A1",
            quant: 1,
        });
        const req = {
            params: { id: String(kask._id) },
            body: { nameukr: "Нове", quant: 5 },
        };
        await updateKaskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Kask updated successfully");
        expect(responseJson.data.nameukr).toBe("Нове");
        expect(responseJson.data.quant).toBe(5);
    });
});
