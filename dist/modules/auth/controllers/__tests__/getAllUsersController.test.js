import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getAllUsersController } from "../get-all-users/getAllUsersController.js";
describe("getAllUsersController", () => {
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
    it("200: возвращает всех пользователей без паролей", async () => {
        await createTestUser({ username: `user1-${Date.now()}` });
        await createTestUser({ username: `user2-${Date.now()}` });
        const req = {};
        await getAllUsersController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(2);
        responseJson.forEach((user) => {
            expect(user.password).toBeUndefined();
            expect(user._id).toBeDefined();
        });
    });
    it("200: возвращает пустой массив если пользователей нет", async () => {
        const req = {};
        await getAllUsersController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(0);
    });
});
