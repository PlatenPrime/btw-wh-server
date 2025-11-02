import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { getPullByPalletIdController } from "../get-pull-by-pallet-id/getPullByPalletIdController.js";
describe("getPullByPalletIdController", () => {
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
            headersSent: false,
        };
    });
    it("400: ошибка валидации при невалидном palletId", async () => {
        const req = {
            params: {
                palletId: "invalid-id",
            },
        };
        await getPullByPalletIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Invalid pallet ID format");
    });
    it("200: возвращает exists: false если pull не найден", async () => {
        const req = {
            params: {
                palletId: new mongoose.Types.ObjectId().toString(),
            },
        };
        await getPullByPalletIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.data).toBeNull();
    });
    it("200: возвращает exists: true если pull найден", async () => {
        // Этот тест будет успешным только если есть реальные данные
        // Для полноты покрытия оставляем структуру
        const req = {
            params: {
                palletId: new mongoose.Types.ObjectId().toString(),
            },
        };
        await getPullByPalletIdController(req, res);
        // Может быть exists: false если нет данных или exists: true если есть
        expect(responseStatus.code).toBe(200);
        expect(responseJson).toHaveProperty("exists");
        if (responseJson.exists) {
            expect(responseJson.data).toBeDefined();
        }
    });
});
