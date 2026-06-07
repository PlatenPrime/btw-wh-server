import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../models/Kask.js";
import { getKaskById } from "../get-kask-by-id/getKaskById.js";
describe("getKaskById", () => {
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
        await getKaskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("200 with exists false when kask not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getKaskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Kask not found");
        expect(responseJson.data).toBeNull();
    });
    it("200 returns kask data when found", async () => {
        const kask = await Kask.create({
            artikul: "1234-5678",
            nameukr: "Кулька",
            zone: "A1",
        });
        const req = { params: { id: String(kask._id) } };
        await getKaskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Kask retrieved successfully");
        expect(responseJson.data.artikul).toBe("1234-5678");
    });
});
