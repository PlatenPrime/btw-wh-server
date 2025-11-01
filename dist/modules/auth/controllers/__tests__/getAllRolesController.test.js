import { beforeEach, describe, expect, it, vi } from "vitest";
import Role from "../../models/Role.js";
import { getAllRolesController } from "../get-all-roles/getAllRolesController.js";
describe("getAllRolesController", () => {
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
    it("200: возвращает все роли", async () => {
        await Role.create({ value: "USER", name: "User" });
        await Role.create({ value: "ADMIN", name: "Admin" });
        const req = {};
        await getAllRolesController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(2);
        expect(responseJson.some((r) => r.value === "USER")).toBe(true);
        expect(responseJson.some((r) => r.value === "ADMIN")).toBe(true);
    });
    it("200: возвращает пустой массив если ролей нет", async () => {
        const req = {};
        await getAllRolesController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(0);
    });
});
