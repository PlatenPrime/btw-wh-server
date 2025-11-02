import { beforeEach, describe, expect, it } from "vitest";
import { getPullsController } from "../get-pulls/getPullsController.js";
describe("getPullsController", () => {
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
    it("200: возвращает pulls с корректной структурой", async () => {
        const req = {};
        await getPullsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.message).toBe("Pulls calculated successfully");
        expect(responseJson.data).toBeDefined();
        expect(responseJson.data).toHaveProperty("pulls");
        expect(responseJson.data).toHaveProperty("totalPulls");
        expect(responseJson.data).toHaveProperty("totalAsks");
        expect(Array.isArray(responseJson.data.pulls)).toBe(true);
    });
});
