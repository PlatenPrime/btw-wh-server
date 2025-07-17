import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, createTestPallet, createTestPos, createTestRow, } from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { deletePos } from "../deletePos.js";
describe("deletePos Controller", () => {
    let row;
    let pallet;
    let pos;
    beforeEach(async () => {
        row = await createTestRow();
        pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
        pos = await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
        });
    });
    it("should delete pos by valid ID", async () => {
        const req = createMockRequest({ params: { id: pos._id.toString() } });
        const res = createMockResponse();
        await deletePos(req, res);
        expect(res.body.message).toBe("Position deleted successfully");
    });
    it("should return 404 if pos not found", async () => {
        const req = createMockRequest({
            params: { id: new mongoose.Types.ObjectId().toString() },
        });
        const res = createMockResponse();
        await deletePos(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Position not found");
    });
    it("should return 400 for invalid ID", async () => {
        const req = createMockRequest({ params: { id: "invalid-id" } });
        const res = createMockResponse();
        await deletePos(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid position ID");
    });
    it("should handle server error", async () => {
        const req = createMockRequest({ params: { id: pos._id.toString() } });
        const res = createMockResponse();
        vi.spyOn(Pos, "findByIdAndDelete").mockImplementationOnce(() => {
            throw new Error("DB error");
        });
        await deletePos(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to delete position");
    });
});
