import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createMockRequest, createMockResponse, createTestPallet, createTestRow, } from "../../../../test/utils/testHelpers.js";
import { Event } from "../../../events/models/Event.js";
import { Pos } from "../../models/Pos.js";
import { bulkCreatePoses } from "../index.js";
describe("bulkCreatePoses Controller", () => {
    let row;
    let pallet;
    beforeEach(async () => {
        row = await createTestRow();
        pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
    });
    it("should create multiple poses with valid data", async () => {
        const req = createMockRequest({
            body: {
                poses: [
                    {
                        palletId: pallet._id.toString(),
                        rowId: row._id.toString(),
                        palletTitle: pallet.title,
                        rowTitle: row.title,
                        artikul: "BULK-1",
                        nameukr: "Nameukr-1",
                        quant: 10,
                        boxes: 1,
                    },
                    {
                        palletId: pallet._id.toString(),
                        rowId: row._id.toString(),
                        palletTitle: pallet.title,
                        rowTitle: row.title,
                        artikul: "BULK-2",
                        nameukr: "Nameukr-2",
                        quant: 20,
                        boxes: 2,
                    },
                ],
            },
        });
        const res = createMockResponse();
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(201);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0].artikul).toBe("BULK-1");
        expect(res.body.data[0].nameukr).toBe("Nameukr-1");
        expect(res.body.data[1].artikul).toBe("BULK-2");
        expect(res.body.data[1].nameukr).toBe("Nameukr-2");
    });
    it("should create an audit event when req.user is present", async () => {
        const user = await createTestUser({
            username: `bulk-pos-event-${Date.now()}`,
        });
        const req = createMockRequest({
            user: { id: user._id.toString(), role: "ADMIN" },
            body: {
                poses: [
                    {
                        palletId: pallet._id.toString(),
                        rowId: row._id.toString(),
                        artikul: "BULK-EVENT",
                        quant: 1,
                        boxes: 1,
                    },
                ],
            },
        });
        const res = createMockResponse();
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(201);
        const events = await Event.find({ department: "poses" });
        expect(events).toHaveLength(1);
        expect(events[0].description).toContain("1");
    });
    it("should return 400 if poses array is empty", async () => {
        const req = createMockRequest({ body: { poses: [] } });
        const res = createMockResponse();
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
    it("should return 400 if a pose has invalid palletId or rowId", async () => {
        const req = createMockRequest({
            body: {
                poses: [
                    {
                        palletId: "invalid-id",
                        rowId: "invalid-id",
                        artikul: "A",
                        nameukr: "B",
                        quant: 1,
                        boxes: 1,
                    },
                ],
            },
        });
        const res = createMockResponse();
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
    it("should return 404 if referenced pallet does not exist", async () => {
        const req = createMockRequest({
            body: {
                poses: [
                    {
                        palletId: new mongoose.Types.ObjectId().toString(),
                        rowId: row._id.toString(),
                        artikul: "A",
                        nameukr: "B",
                        quant: 1,
                        boxes: 1,
                    },
                ],
            },
        });
        const res = createMockResponse();
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Some pallets not found");
    });
    it("should return 404 if referenced row does not exist", async () => {
        const req = createMockRequest({
            body: {
                poses: [
                    {
                        palletId: pallet._id.toString(),
                        rowId: new mongoose.Types.ObjectId().toString(),
                        artikul: "A",
                        nameukr: "B",
                        quant: 1,
                        boxes: 1,
                    },
                ],
            },
        });
        const res = createMockResponse();
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Some rows not found");
    });
    it("should return 500 if database error occurs during creation", async () => {
        const req = createMockRequest({
            body: {
                poses: [
                    {
                        palletId: pallet._id.toString(),
                        rowId: row._id.toString(),
                        artikul: "A",
                        nameukr: "B",
                        quant: 1,
                        boxes: 1,
                    },
                ],
            },
        });
        const res = createMockResponse();
        // Mock Pos.create to throw
        const origCreate = Pos.create;
        Pos.create = vi.fn().mockRejectedValue(new Error("DB error"));
        await bulkCreatePoses(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to create positions");
        // Restore original
        Pos.create = origCreate;
    });
});
