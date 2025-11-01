import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { updateArtLimitController } from "../update-art-limit/updateArtLimitController.js";
describe("updateArtLimitController", () => {
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
    it("200: обновляет limit артикула", async () => {
        const testArt = await createTestArt({
            artikul: "ART-001",
            zone: "A1",
            limit: 50,
        });
        const req = {
            params: { id: testArt._id.toString() },
            body: { limit: 100 },
        };
        await updateArtLimitController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.artikul).toBe("ART-001");
        expect(responseJson.limit).toBe(100);
    });
    it("404: возвращает ошибку если артикул не найден", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const req = {
            params: { id: nonExistentId.toString() },
            body: { limit: 100 },
        };
        await updateArtLimitController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Art not found");
    });
    it("400: ошибка валидации при невалидном ID", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { limit: 100 },
        };
        await updateArtLimitController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при отрицательном limit", async () => {
        const testArt = await createTestArt({ artikul: "ART-001", zone: "A1" });
        const req = {
            params: { id: testArt._id.toString() },
            body: { limit: -10 },
        };
        await updateArtLimitController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при отсутствии limit", async () => {
        const testArt = await createTestArt({ artikul: "ART-001", zone: "A1" });
        const req = {
            params: { id: testArt._id.toString() },
            body: {},
        };
        await updateArtLimitController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
