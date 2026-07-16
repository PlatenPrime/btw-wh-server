import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Konk } from "../../models/Konk.js";
import { updateKonkByIdController } from "../update-konk-by-id/updateKonkByIdController.js";
describe("updateKonkByIdController", () => {
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
    it("400 when id invalid", async () => {
        const req = {
            params: { id: "invalid" },
            body: { title: "New" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when konk not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { title: "New" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates and returns data", async () => {
        const konk = await Konk.create({
            name: "x",
            title: "Old",
            url: "https://x.com",
            imageUrl: "https://x.com/1.png",
        });
        const req = {
            params: { id: konk._id.toString() },
            body: { title: "New Title" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New Title");
    });
    it("200 clears recountDays via patch", async () => {
        const konk = await Konk.create({
            name: "x2",
            title: "Old",
            url: "https://x.com",
            imageUrl: "https://x.com/1.png",
            recountDays: ["2026-04-01"],
        });
        const req = {
            params: { id: konk._id.toString() },
            body: { recountDays: [] },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.recountDays).toEqual([]);
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `konk-update-event-${Date.now()}` });
        const konk = await Konk.create({
            name: "x",
            title: "Old",
            url: "https://x.com",
            imageUrl: "https://x.com/1.png",
        });
        const req = {
            params: { id: konk._id.toString() },
            body: { title: "New Title" },
            user: { id: user._id.toString(), role: "ADMIN" },
        };
        await updateKonkByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "konks" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
