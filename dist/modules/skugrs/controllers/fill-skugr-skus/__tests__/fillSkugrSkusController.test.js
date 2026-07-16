import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { UnsupportedKonkForGroupProductsError } from "../../../../browser/group-products/fetchGroupProductsByKonkName.js";
import { Event } from "../../../../events/models/Event.js";
import { fillSkugrSkusController } from "../fillSkugrSkusController.js";
vi.mock("../../../utils/fillSkugrSkusFromBrowserUtil.js", () => ({
    fillSkugrSkusFromBrowserUtil: vi.fn(),
}));
import { fillSkugrSkusFromBrowserUtil } from "../../../utils/fillSkugrSkusFromBrowserUtil.js";
const mockFill = vi.mocked(fillSkugrSkusFromBrowserUtil);
describe("fillSkugrSkusController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        mockFill.mockReset();
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
    it("400 on validation error", async () => {
        const req = {
            params: { id: "" },
            body: {},
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when skugr not found", async () => {
        mockFill.mockResolvedValue(null);
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: {},
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("400 on unsupported konk from util", async () => {
        mockFill.mockRejectedValue(new UnsupportedKonkForGroupProductsError("air"));
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: {},
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toMatch(/air/);
    });
    it("200 creates audit event when req.user is present", async () => {
        const user = await createTestUser({ username: `skugr-fill-event-${Date.now()}` });
        mockFill.mockResolvedValue({
            skugr: {
                _id: new mongoose.Types.ObjectId(),
                title: "Group",
                konkName: "k1",
                prodName: "p1",
                url: "https://k1.com/g",
                isSliced: true,
                skus: [],
            },
            stats: {
                fetched: 3,
                dedupedByUrl: 0,
                skippedAlreadyInGroup: 0,
                skippedNoProductId: 0,
                skippedProductIdConflict: 0,
                skippedNonNewskuManufacturer: 0,
                promotedFromNewsku: 0,
                linkedExisting: 1,
                created: 2,
            },
        });
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: {},
            user: { id: user._id.toString(), role: "ADMIN" },
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "skugrs" });
        expect(events).toHaveLength(1);
        expect(events[0].userId.toString()).toBe(user._id.toString());
    });
});
