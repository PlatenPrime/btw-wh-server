import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getMeController } from "../get-me/getMeController.js";
describe("getMeController", () => {
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
        vi.clearAllMocks();
    });
    it("200: возвращает пользователя и токен", async () => {
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            fullname: "Test User",
            role: "USER",
        });
        const req = {
            params: {
                id: user._id.toString(),
            },
        };
        await getMeController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user._id.toString()).toBe(user._id.toString());
        expect(responseJson.token).toBeTruthy();
        expect(responseJson.user.password).toBeUndefined();
    });
    it("400: ошибка валидации при невалидном ID", async () => {
        const req = {
            params: {
                id: "invalid-id",
            },
        };
        await getMeController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404: пользователь не найден", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const req = {
            params: {
                id: fakeId,
            },
        };
        await getMeController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Користувач не знайдений");
    });
});
