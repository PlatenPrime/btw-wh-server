import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Prod } from "../../models/Prod.js";
import { deleteProdByIdController } from "../delete-prod-by-id/deleteProdByIdController.js";
describe("deleteProdByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Prod.deleteMany({});
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
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when prod not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes prod", async () => {
        const prod = await Prod.create({
            name: "to-delete",
            title: "To Delete",
            imageUrl: "https://x.com/1.png",
        });
        const req = { params: { id: prod._id.toString() } };
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Prod.findById(prod._id);
        expect(found).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `prod-delete-event-${Date.now()}` });
        const prod = await Prod.create({
            name: "to-delete-event",
            title: "To Delete",
            imageUrl: "https://x.com/1.png",
        });
        const req = {
            params: { id: prod._id.toString() },
            user: { id: user._id.toString(), role: "PRIME" },
        };
        await deleteProdByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "prods" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
