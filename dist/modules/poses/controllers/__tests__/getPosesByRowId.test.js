import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, createTestPallet, createTestPos, createTestRow, } from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { getPosesByRowId } from "../getPosesByRowId.js";
describe("getPosesByRowId Controller", () => {
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
    it("should return poses by valid rowId", async () => {
        const req = createMockRequest({ params: { rowId: row._id.toString() } });
        const res = createMockResponse();
        await getPosesByRowId(req, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]._id.toString()).toBe(pos._id.toString());
    });
    it("should return 400 for invalid rowId", async () => {
        const req = createMockRequest({ params: { rowId: "invalid-id" } });
        const res = createMockResponse();
        await getPosesByRowId(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid row ID");
    });
    it("should handle server error", async () => {
        const req = createMockRequest({ params: { rowId: row._id.toString() } });
        const res = createMockResponse();
        vi.spyOn(Pos, "find").mockImplementationOnce(() => {
            throw new Error("DB error");
        });
        await getPosesByRowId(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to fetch poses by row");
    });
});
