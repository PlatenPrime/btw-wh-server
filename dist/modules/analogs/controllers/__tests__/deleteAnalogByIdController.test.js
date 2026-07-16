import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Analog } from "../../models/Analog.js";
import { deleteAnalogByIdController } from "../delete-analog-by-id/deleteAnalogByIdController.js";
describe("deleteAnalogByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Analog.deleteMany({});
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
    it("400 when id invalid", async () => {
        const req = { params: { id: "invalid" } };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when analog not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes analog", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const req = { params: { id: analog._id.toString() } };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Analog.findById(analog._id);
        expect(found).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `analog-delete-event-${Date.now()}` });
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const req = {
            params: { id: analog._id.toString() },
            user: { id: user._id.toString(), role: "PRIME" },
        };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "analogs" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
