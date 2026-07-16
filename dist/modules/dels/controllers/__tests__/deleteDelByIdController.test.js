import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Del } from "../../models/Del.js";
import { deleteDelByIdController } from "../delete-del-by-id/deleteDelByIdController.js";
describe("deleteDelByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Del.deleteMany({});
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
    it("404 when del not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteDelByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes del", async () => {
        const del = await Del.create({
            title: "To delete",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: {},
        });
        const req = { params: { id: del._id.toString() } };
        await deleteDelByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Del.findById(del._id);
        expect(found).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `del-delete-event-${Date.now()}` });
        const del = await Del.create({
            title: "To delete with event",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: {},
        });
        const req = {
            user: { id: String(user._id), role: "PRIME" },
            params: { id: del._id.toString() },
        };
        await deleteDelByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "dels" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(String(user._id));
        expect(events[0].description).toBe(`Видалено поставку "To delete with event" від виробника prod1 (id: ${del._id})`);
    });
});
