import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Block } from "../../../../blocks/models/Block.js";
import { Event } from "../../../../events/models/Event.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { Seg } from "../../../models/Seg.js";
import { updateSeg } from "../updateSeg.js";
describe("updateSeg Controller", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    const createZone = async () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 99) + 1;
        return Zone.create({
            title: `42-${(timestamp % 99) + 1}-${random}`,
            bar: Math.max(1, Math.floor(Math.random() * 1_000_000)),
            sector: 0,
        });
    };
    beforeEach(() => {
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
        };
    });
    it("200: updates segment order", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}`, order: 2, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 2001,
            zones: [],
        });
        mockRequest = {
            params: { id: seg._id.toString() },
            body: { order: 3 },
        };
        await updateSeg(mockRequest, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Segment updated successfully");
        expect(responseJson.data.order).toBe(3);
        expect(responseJson.data.sector).toBe(2003);
    });
    it("200: creates audit event when req.user is present", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-event`, order: 2, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 2001,
            zones: [],
        });
        const user = await createTestUser({
            username: `update-seg-event-${Date.now()}`,
        });
        mockRequest = {
            user: { id: user._id.toString(), role: "ADMIN" },
            params: { id: seg._id.toString() },
            body: { order: 3 },
        };
        await updateSeg(mockRequest, res);
        expect(responseStatus.code).toBe(200);
        const events = await Event.find({ department: "segs" });
        expect(events).toHaveLength(1);
    });
    it("404: segment not found", async () => {
        mockRequest = {
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { order: 2 },
        };
        await updateSeg(mockRequest, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Segment not found");
    });
    it("400: validation error for invalid id", async () => {
        mockRequest = {
            params: { id: "bad-id" },
            body: { order: 2 },
        };
        await updateSeg(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("400: at least one field must be provided", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-empty`, order: 1, segs: [] });
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        mockRequest = {
            params: { id: seg._id.toString() },
            body: {},
        };
        await updateSeg(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("At least one field (order or zones) must be provided");
    });
    it("500: zones already belong to other segments (case-sensitive zones check in controller)", async () => {
        const block = await Block.create({ title: `Block-${Date.now()}-z`, order: 1, segs: [] });
        const zone = await createZone();
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 1001,
            zones: [],
        });
        await Zone.updateOne({ _id: zone._id }, { $set: { "seg.id": new mongoose.Types.ObjectId(), sector: 1001 } });
        mockRequest = {
            params: { id: seg._id.toString() },
            body: { zones: [zone._id.toString()] },
        };
        await updateSeg(mockRequest, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
});
