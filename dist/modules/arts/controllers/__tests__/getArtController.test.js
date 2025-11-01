import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getArtController } from "../get-art/getArtController.js";
describe("getArtController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
    });
    it("200: возвращает артикул по artikul", async () => {
        const testArt = await createTestArt({
            artikul: "ART-001",
            nameukr: "Test Art",
            zone: "A1",
        });
        const req = { params: { artikul: "ART-001" } };
        await getArtController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("ART-001");
        expect(responseJson.data._id).toBeDefined();
    });
    it("200: возвращает exists false если артикул не найден", async () => {
        const req = { params: { artikul: "NONEXISTENT" } };
        await getArtController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Art not found");
        expect(responseJson.data).toBe(null);
    });
    it("400: ошибка валидации при пустом artikul", async () => {
        const req = { params: { artikul: "" } };
        await getArtController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Artikul is required");
    });
});
