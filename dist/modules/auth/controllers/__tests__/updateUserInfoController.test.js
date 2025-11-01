import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { hashPasswordUtil } from "../../utils/hashPasswordUtil.js";
import { updateUserInfoController } from "../update-user-info/updateUserInfoController.js";
describe("updateUserInfoController", () => {
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
    it("200: обновляет пользователя", async () => {
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            fullname: "Old Name",
        });
        const req = {
            params: {
                userId: user._id.toString(),
            },
            body: {
                fullname: "New Name",
                role: "ADMIN",
            },
        };
        await updateUserInfoController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user.fullname).toBe("New Name");
        expect(responseJson.user.role).toBe("ADMIN");
        expect(responseJson.token).toBeTruthy();
        expect(responseJson.user.password).toBeUndefined();
    });
    it("200: обновляет пароль если он передан", async () => {
        const oldPassword = hashPasswordUtil("oldPassword");
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            password: oldPassword,
        });
        const req = {
            params: {
                userId: user._id.toString(),
            },
            body: {
                password: "newPassword123",
            },
        };
        await updateUserInfoController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user.password).toBeUndefined();
    });
    it("400: ошибка валидации при невалидном userId", async () => {
        const req = {
            params: {
                userId: "invalid-id",
            },
            body: {
                fullname: "New Name",
            },
        };
        await updateUserInfoController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404: пользователь не найден", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const req = {
            params: {
                userId: fakeId,
            },
            body: {
                fullname: "New Name",
            },
        };
        await updateUserInfoController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Користувач не знайдений");
    });
});
