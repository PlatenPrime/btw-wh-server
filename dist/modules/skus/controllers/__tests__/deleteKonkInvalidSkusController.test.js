import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Sku } from "../../models/Sku.js";
import { deleteKonkInvalidSkusController } from "../delete-konk-invalid-skus/deleteKonkInvalidSkusController.js";
describe("deleteKonkInvalidSkusController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Event.deleteMany({});
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 when konkName empty", async () => {
        const req = { params: { konkName: "" } };
        await deleteKonkInvalidSkusController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 deletes invalid skus for konk", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-bad",
            title: "Bad",
            url: "https://ex.com/bad",
            isInvalid: true,
        });
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-good",
            title: "Good",
            url: "https://ex.com/good",
            isInvalid: false,
        });
        const req = { params: { konkName: "air" } };
        await deleteKonkInvalidSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.deletedCount).toBe(1);
        expect(await Sku.countDocuments({ isInvalid: true })).toBe(0);
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `sku-invalid-event-${Date.now()}` });
        await Sku.create({
            konkName: "air2",
            prodName: "p",
            productId: "air2-bad",
            title: "Bad",
            url: "https://ex.com/bad2",
            isInvalid: true,
        });
        const req = {
            params: { konkName: "air2" },
            user: { id: user._id.toString(), role: "PRIME" },
        };
        await deleteKonkInvalidSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skus" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
