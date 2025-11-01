import { beforeEach, describe, expect, it, vi } from "vitest";
import Role from "../../models/Role.js";
import { createTestUser } from "../../../../test/setup.js";
import { registrateUserController } from "../registrate-user/registrateUserController.js";
describe("registrateUserController", () => {
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
    it("201: создаёт пользователя", async () => {
        const req = {
            body: {
                username: `newuser-${Date.now()}`,
                password: "password123",
                fullname: "New User",
            },
        };
        await registrateUserController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user.username).toBe(req.body.username);
        expect(responseJson.user.fullname).toBe("New User");
        expect(responseJson.user.password).toBeUndefined();
    });
    it("400: ошибка валидации при отсутствии обязательных полей", async () => {
        const req = {
            body: {
                username: "testuser",
                // password и fullname пропущены
            },
        };
        await registrateUserController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("409: конфликт username", async () => {
        const existingUser = await createTestUser({
            username: `existing-${Date.now()}`,
        });
        const req = {
            body: {
                username: existingUser.username,
                password: "password123",
                fullname: "New User",
            },
        };
        await registrateUserController(req, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toContain("вже існує");
    });
    it("201: создаёт пользователя с ролью если она существует", async () => {
        await Role.create({ value: "ADMIN", name: "Admin" });
        const req = {
            body: {
                username: `admin-${Date.now()}`,
                password: "password123",
                fullname: "Admin User",
                role: "ADMIN",
            },
        };
        await registrateUserController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.user.role).toBe("ADMIN");
    });
});
