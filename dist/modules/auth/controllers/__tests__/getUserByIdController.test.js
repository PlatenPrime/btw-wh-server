import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getUserByIdController } from "../get-user-by-id/getUserByIdController.js";
describe("getUserByIdController", () => {
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
    it("200: возвращает пользователя без пароля", async () => {
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            fullname: "Test User",
        });
        const req = {
            params: {
                id: user._id.toString(),
            },
        };
        await getUserByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user._id.toString()).toBe(user._id.toString());
        expect(responseJson.user.password).toBeUndefined();
    });
    it("400: ошибка валидации при невалидном ID", async () => {
        const req = {
            params: {
                id: "invalid-id",
            },
        };
        await getUserByIdController(req, res);
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
        await getUserByIdController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Користувач не знайдений");
    });
});
