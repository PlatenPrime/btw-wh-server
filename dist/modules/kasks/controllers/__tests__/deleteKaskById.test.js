import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Kask } from "../../models/Kask.js";
import { deleteKaskById } from "../delete-kask-by-id/deleteKaskById.js";
describe("deleteKaskById", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Kask.deleteMany({});
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
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when kask not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Kask not found");
    });
    it("200 deletes kask and returns artikul", async () => {
        const kask = await Kask.create({
            artikul: "5555-5555",
            nameukr: "To delete",
            zone: "A1",
        });
        const req = { params: { id: String(kask._id) } };
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Kask deleted successfully");
        expect(responseJson.data.artikul).toBe("5555-5555");
        const found = await Kask.findById(kask._id);
        expect(found).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `kask-del-event-${Date.now()}` });
        const kask = await Kask.create({
            artikul: "8888-8888",
            nameukr: "To delete",
            zone: "A1",
        });
        const req = {
            user: { id: String(user._id), role: "PRIME" },
            params: { id: String(kask._id) },
        };
        await deleteKaskById(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "kasks" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(String(user._id));
        expect(events[0].description).toBe("Видалено касовий запит на артикул 8888-8888 (id: " + kask._id + ")");
    });
});
