import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { getAllPalletsController } from "../get-all-pallets/getAllPalletsController.js";
describe("getAllPalletsController", () => {
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
    });
    it("200: возвращает все паллеты", async () => {
        await createTestPallet({ title: "Pallet-1" });
        await createTestPallet({ title: "Pallet-2" });
        const req = {};
        await getAllPalletsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBeGreaterThanOrEqual(2);
    });
    it("200: возвращает пустой массив если паллет нет", async () => {
        const req = {};
        await getAllPalletsController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(0);
    });
});
