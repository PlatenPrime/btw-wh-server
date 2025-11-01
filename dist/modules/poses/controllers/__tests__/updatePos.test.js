import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, createTestPos, } from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { updatePos } from "../index.js";
describe("updatePos Controller", () => {
    let pos;
    beforeEach(async () => {
        pos = await createTestPos();
    });
    it("should update pos by valid ID", async () => {
        const req = createMockRequest({
            params: { id: pos._id.toString() },
            body: {
                artikul: "UPDATED",
                quant: 99,
                boxes: 9,
                sklad: "pogrebi",
                comment: "new comment"
            },
        });
        const res = createMockResponse();
        await updatePos(req, res);
        expect(res.body.artikul).toBe("UPDATED");
        expect(res.body.quant).toBe(99);
        expect(res.body.boxes).toBe(9);
        expect(res.body.sklad).toBe("pogrebi");
        expect(res.body.comment).toBe("new comment");
    });
    it("should return 404 if pos not found", async () => {
        const req = createMockRequest({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: {
                artikul: "NOPE",
                quant: 1,
                boxes: 1,
            },
        });
        const res = createMockResponse();
        await updatePos(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Position not found");
    });
    it("should return 400 for invalid ID", async () => {
        const req = createMockRequest({
            params: { id: "invalid-id" },
            body: {
                artikul: "NOPE",
                quant: 1,
                boxes: 1,
            },
        });
        const res = createMockResponse();
        await updatePos(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid position ID");
    });
    it("should handle server error", async () => {
        const req = createMockRequest({
            params: { id: pos._id.toString() },
            body: {
                artikul: "ERR",
                quant: 1,
                boxes: 1,
            },
        });
        const res = createMockResponse();
        vi.spyOn(Pos, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("DB error");
        });
        await updatePos(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to update position");
    });
});
