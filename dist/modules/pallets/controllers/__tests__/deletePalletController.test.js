import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { Event } from "../../../events/models/Event.js";
import { deletePalletController } from "../delete-pallet/deletePalletController.js";
describe("deletePalletController", () => {
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
    it("200: удаляет паллету", async () => {
        const pallet = await createTestPallet({ title: "Pallet-To-Delete" });
        const req = {
            params: { id: String(pallet._id) },
        };
        await deletePalletController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet deleted");
    });
    it("200: создаёт audit event, если есть req.user", async () => {
        const pallet = await createTestPallet({ title: "Pallet-Event-Delete" });
        const user = await createTestUser({
            username: `delete-pallet-event-${Date.now()}`,
        });
        const req = {
            user: { id: user._id.toString(), role: "PRIME" },
            params: { id: String(pallet._id) },
        };
        await deletePalletController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "pallets" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("Pallet-Event-Delete");
    });
    it("404: если паллета не найдена", async () => {
        const req = {
            params: { id: new mongoose.Types.ObjectId().toString() },
        };
        await deletePalletController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
    it("400: ошибка валидации при невалидном id", async () => {
        const req = { params: { id: "invalid-id" } };
        await deletePalletController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
});
