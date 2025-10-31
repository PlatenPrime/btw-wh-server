import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createAskController } from "../create-ask/createAskController.js";
describe("createAskController", () => {
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
        vi.clearAllMocks();
    });
    it("201: создаёт заявку", async () => {
        const user = await createTestUser({ fullname: "Asker" });
        const req = {
            body: {
                artikul: "ART-NEW",
                nameukr: "Найменування",
                quant: 4,
                com: "комент",
                askerId: String(user._id),
            },
        };
        await createAskController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson).toBeTruthy();
        expect(responseJson.artikul).toBe("ART-NEW");
        expect(responseJson.status).toBe("new");
        expect(responseJson._id).toBeDefined();
    });
    it("400: ошибка валидации при отсутствии artikul", async () => {
        const user = await createTestUser();
        const req = {
            body: {
                // artikul пропущен
                nameukr: "Найменування",
                quant: 4,
                com: "комент",
                askerId: String(user._id),
            },
        };
        await createAskController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(Array.isArray(responseJson.errors)).toBe(true);
    });
    it("404: если пользователь не найден", async () => {
        const req = {
            body: {
                artikul: "ART-NEW",
                nameukr: "Найменування",
                quant: 1,
                com: "",
                askerId: new mongoose.Types.ObjectId().toString(),
            },
        };
        await createAskController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("User not found");
    });
});
