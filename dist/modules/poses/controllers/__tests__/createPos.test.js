import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, createTestPallet, createTestRow, } from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { createPos } from "../createPos.js";
describe("createPos Controller", () => {
    let row;
    let pallet;
    beforeEach(async () => {
        row = await createTestRow();
        pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
    });
    it("should create a pos with valid data", async () => {
        const req = createMockRequest({
            body: {
                palletId: pallet._id.toString(),
                rowId: row._id.toString(),
                palletTitle: pallet.title,
                rowTitle: row.title,
                artikul: "ART-1",
                quant: 5,
                boxes: 2,
            },
        });
        const res = createMockResponse();
        await createPos(req, res);
        expect(res.statusCode).toBe(201);
        expect(res.body.artikul).toBe("ART-1");
        expect(res.body.pallet._id.toString()).toBe(pallet._id.toString());
        expect(res.body.row._id.toString()).toBe(row._id.toString());
    });
    it("should return 404 if pallet not found", async () => {
        const req = createMockRequest({
            body: {
                palletId: new mongoose.Types.ObjectId().toString(),
                rowId: row._id.toString(),
                palletTitle: "No Pallet",
                rowTitle: row.title,
                artikul: "ART-2",
                quant: 5,
                boxes: 2,
            },
        });
        const res = createMockResponse();
        await createPos(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Pallet not found");
    });
    it("should return 404 if row not found", async () => {
        const req = createMockRequest({
            body: {
                palletId: pallet._id.toString(),
                rowId: new mongoose.Types.ObjectId().toString(),
                palletTitle: pallet.title,
                rowTitle: "No Row",
                artikul: "ART-3",
                quant: 5,
                boxes: 2,
            },
        });
        const res = createMockResponse();
        await createPos(req, res);
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe("Row not found");
    });
    it("should return 400 for invalid data", async () => {
        const req = createMockRequest({
            body: {
                palletId: "invalid",
                rowId: row._id.toString(),
                palletTitle: pallet.title,
                rowTitle: row.title,
                artikul: "ART-4",
                quant: 5,
                boxes: 2,
            },
        });
        const res = createMockResponse();
        await createPos(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeDefined();
    });
    it("should handle server error", async () => {
        const req = createMockRequest({
            body: {
                palletId: pallet._id.toString(),
                rowId: row._id.toString(),
                palletTitle: pallet.title,
                rowTitle: row.title,
                artikul: "ART-5",
                quant: 5,
                boxes: 2,
            },
        });
        const res = createMockResponse();
        vi.spyOn(Pos, "create").mockImplementationOnce(() => {
            throw new Error("DB error");
        });
        await createPos(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to create position");
    });
});
