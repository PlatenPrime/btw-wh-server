import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Skugr } from "../../models/Skugr.js";
import { deleteSkugrByIdController } from "../delete-skugr-by-id/deleteSkugrByIdController.js";
describe("deleteSkugrByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Skugr.deleteMany({});
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
    it("404 when missing", async () => {
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
        };
        await deleteSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes", async () => {
        const doc = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "T",
            url: "https://k.com/t",
            skus: [],
        });
        const req = { params: { id: doc._id.toString() } };
        await deleteSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBeDefined();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `skugr-delete-event-${Date.now()}` });
        const doc = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "T",
            url: "https://k.com/t-event",
            skus: [],
        });
        const req = {
            params: { id: doc._id.toString() },
            user: { id: user._id.toString(), role: "PRIME" },
        };
        await deleteSkugrByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skugrs" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
