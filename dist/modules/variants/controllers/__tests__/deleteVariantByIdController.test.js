import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Variant } from "../../models/Variant.js";
import { deleteVariantByIdController } from "../delete-variant-by-id/deleteVariantByIdController.js";
describe("deleteVariantByIdController", () => {
    let res;
    let responseStatus;
    let responseJson;
    beforeEach(async () => {
        await Variant.deleteMany({});
        await Event.deleteMany({});
        responseStatus = {};
        responseJson = {};
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
        await deleteVariantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when variant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteVariantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes variant", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Variant",
            url: "https://x.com",
            imageUrl: "https://example.com/img.png",
        });
        const req = { params: { id: variant._id.toString() } };
        await deleteVariantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Variant.findById(variant._id);
        expect(found).toBeNull();
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `variant-delete-event-${Date.now()}` });
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Variant",
            url: "https://x.com",
            imageUrl: "https://example.com/img.png",
        });
        const req = {
            params: { id: variant._id.toString() },
            user: { id: user._id.toString(), role: "PRIME" },
        };
        await deleteVariantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "variants" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
