import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Konk } from "../../models/Konk.js";
import { createKonkController } from "../create-konk/createKonkController.js";
describe("createKonkController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Konk.deleteMany({});
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
    it("400 when name missing", async () => {
        const req = {
            body: {
                title: "Title",
                url: "https://x.com",
                imageUrl: "https://x.com/1.png",
            },
        };
        await createKonkController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when name contains spaces", async () => {
        const req = {
            body: {
                name: "acme corp",
                title: "Acme Corp",
                url: "https://example.com",
                imageUrl: "https://example.com/acme.png",
            },
        };
        await createKonkController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates konk and returns data", async () => {
        const req = {
            body: {
                name: "acme",
                title: "Acme Corp",
                url: "https://example.com",
                imageUrl: "https://example.com/acme.png",
                recountDays: ["2026-04-01"],
            },
        };
        await createKonkController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.name).toBe("acme");
        expect(responseJson.data.recountDays).toEqual([
            "2026-04-01",
        ]);
        const count = await Konk.countDocuments();
        expect(count).toBe(1);
    });
    it("201 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `konk-event-${Date.now()}` });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: {
                name: "audited",
                title: "Audited",
                url: "https://audited.com",
                imageUrl: "https://audited.com/1.png",
            },
        };
        await createKonkController(req, res);
        expect(responseStatus.code).toBe(201);
        const events = await Event.find({ department: "konks" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
