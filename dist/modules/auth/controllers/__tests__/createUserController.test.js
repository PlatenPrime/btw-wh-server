import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createUserController } from "../create-user/createUserController.js";
describe("createUserController", () => {
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
    it("201: создаёт пользователя с обязательными полями", async () => {
        const req = {
            body: {
                username: `newuser-${Date.now()}`,
                password: "password123",
                fullname: "New User",
            },
        };
        await createUserController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user.username).toBe(req.body.username);
        expect(responseJson.user.fullname).toBe(req.body.fullname);
        expect(responseJson.user.password).toBeUndefined();
    });
    it("201: создаёт пользователя с опциональными полями role, telegram, photo", async () => {
        const req = {
            body: {
                username: `newuser-${Date.now()}`,
                password: "password123",
                fullname: "New User",
                role: "ADMIN",
                telegram: "@user",
                photo: "https://example.com/photo.jpg",
            },
        };
        await createUserController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.user).toBeTruthy();
        expect(responseJson.user.telegram).toBe("@user");
        expect(responseJson.user.photo).toBe("https://example.com/photo.jpg");
        expect(responseJson.user.password).toBeUndefined();
    });
    it("409: username уже существует", async () => {
        const existing = await createTestUser({ username: `existing-${Date.now()}` });
        const req = {
            body: {
                username: existing.username,
                password: "password123",
                fullname: "Another User",
            },
        };
        await createUserController(req, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toMatch(/username|існує|уже/i);
    });
    it("400: ошибка валидации при отсутствии username", async () => {
        const req = {
            body: {
                password: "password123",
                fullname: "New User",
            },
        };
        await createUserController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при отсутствии password", async () => {
        const req = {
            body: {
                username: `user-${Date.now()}`,
                fullname: "New User",
            },
        };
        await createUserController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: ошибка валидации при отсутствии fullname", async () => {
        const req = {
            body: {
                username: `user-${Date.now()}`,
                password: "password123",
            },
        };
        await createUserController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
