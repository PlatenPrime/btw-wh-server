import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Block } from "../../../models/Block.js";
import { createBlock } from "../createBlock.js";
describe("createBlockController", () => {
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
    it("201: creates block successfully", async () => {
        const req = { body: { title: "New Block" } };
        await createBlock(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.message).toBe("Block created successfully");
        expect(responseJson.data.title).toBe("New Block");
        expect(responseJson.data.order).toBe(1);
        expect(responseJson.data._id).toBeDefined();
    });
    it("201: creates audit event when req.user is present", async () => {
        const user = await createTestUser({
            username: `create-block-event-${Date.now()}`,
        });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: { title: "Event Block" },
        };
        await createBlock(req, res);
        expect(responseStatus.code).toBe(201);
        const events = await Event.find({ department: "blocks" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("Event Block");
    });
    it("400: validation error when title is missing", async () => {
        const req = { body: {} };
        await createBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(Array.isArray(responseJson.errors)).toBe(true);
    });
    it("400: validation error when title is empty", async () => {
        const req = { body: { title: "" } };
        await createBlock(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("409: duplicate title detected before save", async () => {
        await Block.create({ title: "Existing Block", order: 1, segs: [] });
        const req = { body: { title: "Existing Block" } };
        await createBlock(req, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Block with this title already exists");
        expect(responseJson.duplicateFields).toContain("title");
    });
});
