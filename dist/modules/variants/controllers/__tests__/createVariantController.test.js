import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Variant } from "../../models/Variant.js";
import { createVariantController } from "../create-variant/createVariantController.js";
describe("createVariantController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Variant.deleteMany({});
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
    it("400 when body missing required fields", async () => {
        const req = { body: { konkName: "k" } };
        await createVariantController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when imageUrl missing", async () => {
        const req = {
            body: {
                konkName: "k",
                prodName: "p",
                title: "Variant 1",
                url: "https://x.com/1",
            },
        };
        await createVariantController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates variant and saves varGroup", async () => {
        const req = {
            body: {
                konkName: "k",
                prodName: "p",
                title: "Variant 2",
                url: "https://x.com/2",
                imageUrl: "https://example.com/2.png",
                varGroup: { id: "group-1", title: "Group 1" },
            },
        };
        await createVariantController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.varGroup?.id).toBe("group-1");
    });
    it("409 when creating variant with duplicate url", async () => {
        const req1 = {
            body: {
                konkName: "k1",
                prodName: "p",
                title: "Variant A",
                url: "https://same-url.com/page",
                imageUrl: "https://example.com/a.png",
            },
        };
        await createVariantController(req1, res);
        expect(responseStatus.code).toBe(201);
        const req2 = {
            body: {
                konkName: "k2",
                prodName: "p",
                title: "Variant B",
                url: "https://same-url.com/page",
                imageUrl: "https://example.com/b.png",
            },
        };
        await createVariantController(req2, res);
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Variant with this url already exists");
        const count = await Variant.countDocuments();
        expect(count).toBe(1);
    });
    it("201 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `variant-event-${Date.now()}` });
        const req = {
            user: { id: user._id.toString(), role: "ADMIN" },
            body: {
                konkName: "k",
                prodName: "p",
                title: "Audited Variant",
                url: "https://audited.com/variant",
                imageUrl: "https://audited.com/img.png",
            },
        };
        await createVariantController(req, res);
        expect(responseStatus.code).toBe(201);
        const events = await Event.find({ department: "variants" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
