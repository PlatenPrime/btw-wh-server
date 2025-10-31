import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteAskById } from "../delete-ask-by-id/deleteAskById.js";
import { createTestAsk } from "../../../../test/setup.js";
describe("deleteAskById", () => {
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
    it("200: удаляет заявку и возвращает подтверждение", async () => {
        const ask = await createTestAsk({ artikul: "ART-X" });
        const req = { params: { id: String(ask._id) } };
        await deleteAskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Ask deleted successfully");
        expect(responseJson.data.id).toBe(String(ask._id));
        expect(responseJson.data.artikul).toBe("ART-X");
    });
    it("404: ask не найден", async () => {
        const req = { params: { id: new mongoose.Types.ObjectId().toString() } };
        await deleteAskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Ask not found");
    });
    it("400: ошибка валидации", async () => {
        const req = { params: { id: "invalid" } };
        await deleteAskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
