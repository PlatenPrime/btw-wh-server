import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { updatePalletController } from "../update-pallet/updatePalletController.js";
describe("updatePalletController", () => {
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
    it("200: обновляет паллету", async () => {
        const pallet = await createTestPallet({ title: "Old-Pallet", sector: 101 });
        const req = {
            params: { id: String(pallet._id) },
            body: {
                title: "New-Pallet",
                sector: 202,
            },
        };
        await updatePalletController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.title).toBe("New-Pallet");
        expect(responseJson.sector).toBe(202);
    });
    it("404: если паллета не найдена", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { title: "New-Pallet" },
        };
        await updatePalletController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
    it("400: ошибка валидации при невалидном id", async () => {
        const req = {
            params: { id: "invalid-id" },
            body: { title: "New-Pallet" },
        };
        await updatePalletController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
