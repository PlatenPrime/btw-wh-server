import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createTestRow } from "../../../../test/utils/testHelpers.js";
import { Event } from "../../../events/models/Event.js";
import { createPalletController } from "../create-pallet/createPalletController.js";
describe("createPalletController", () => {
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
    it("201: создаёт паллету", async () => {
        const row = await createTestRow({ title: "Row 1" });
        const req = {
            body: {
                title: "Pallet-1-1",
                rowData: {
                    _id: String(row._id),
                    title: row.title,
                },
                sector: 101,
                isDef: false,
            },
        };
        await createPalletController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson._id).toBeDefined();
        expect(responseJson.title).toBe("Pallet-1-1");
        expect(responseJson.sector).toBe(101);
    });
    it("201: создаёт audit event, если есть req.user", async () => {
        const row = await createTestRow({ title: "Row-Event" });
        const user = await createTestUser({
            username: `create-pallet-event-${Date.now()}`,
        });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: {
                title: "Pallet-Event",
                rowData: { _id: String(row._id), title: row.title },
            },
        };
        await createPalletController(req, res);
        expect(responseStatus.code).toBe(201);
        const events = await Event.find({ department: "pallets" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("Pallet-Event");
    });
    it("400: ошибка валидации при отсутствии title", async () => {
        const row = await createTestRow();
        const req = {
            body: {
                rowData: {
                    _id: String(row._id),
                    title: row.title,
                },
            },
        };
        await createPalletController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404: если Row не найден", async () => {
        const req = {
            body: {
                title: "Pallet-1-1",
                rowData: {
                    _id: new mongoose.Types.ObjectId().toString(),
                    title: "NonExistent Row",
                },
            },
        };
        await createPalletController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Row not found");
    });
});
