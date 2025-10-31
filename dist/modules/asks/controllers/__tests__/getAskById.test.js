import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestAsk } from "../../../../test/setup.js";
import { getAskById } from "../get-ask-by-id/getAskById.js";
describe("getAskById", () => {
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
    it("200: возвращает exists=true и данные при наличии заявки", async () => {
        const ask = await createTestAsk({ artikul: "ART-OK" });
        const req = { params: { id: String(ask._id) } };
        await getAskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.artikul).toBe("ART-OK");
    });
    it("200: возвращает exists=false при отсутствии заявки", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await getAskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Ask not found");
        expect(responseJson.data).toBeNull();
    });
    it("400: ошибка валидации при невалидном id", async () => {
        const req = { params: { id: "invalid-id" } };
        await getAskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(Array.isArray(responseJson.errors)).toBe(true);
    });
    it("400: ошибка валидации при отсутствии id", async () => {
        const req = { params: {} };
        await getAskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
