import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { updateArtByIdController } from "../update-art-by-id/updateArtByIdController.js";
describe("updateArtByIdController", () => {
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
    it("200: обновляет limit", async () => {
        const testArt = await createTestArt({
            artikul: "ART-001",
            zone: "A1",
            limit: 50,
        });
        const req = {
            params: { id: testArt._id.toString() },
            body: { limit: 100 },
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.artikul).toBe("ART-001");
        expect(responseJson.limit).toBe(100);
    });
    it("200: обновляет prodName", async () => {
        const testArt = await createTestArt({
            artikul: "ART-PROD",
            zone: "A1",
            prodName: "old",
        });
        const req = {
            params: { id: testArt._id.toString() },
            body: { prodName: "new-name" },
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.prodName).toBe("new-name");
    });
    it("200: обновляет limit и prodName", async () => {
        const testArt = await createTestArt({
            artikul: "ART-BOTH",
            zone: "A1",
            limit: 1,
            prodName: "a",
        });
        const req = {
            params: { id: testArt._id.toString() },
            body: { limit: 2, prodName: "b" },
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(2);
        expect(responseJson.prodName).toBe("b");
    });
    it("404: возвращает ошибку если артикул не найден", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const req = {
            params: { id: nonExistentId.toString() },
            body: { limit: 100 },
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Art not found");
    });
    it("400: ошибка валидации при невалидном ID", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { limit: 100 },
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при отрицательном limit", async () => {
        const testArt = await createTestArt({ artikul: "ART-001", zone: "A1" });
        const req = {
            params: { id: testArt._id.toString() },
            body: { limit: -10 },
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при пустом теле", async () => {
        const testArt = await createTestArt({ artikul: "ART-001", zone: "A1" });
        const req = {
            params: { id: testArt._id.toString() },
            body: {},
        };
        await updateArtByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
