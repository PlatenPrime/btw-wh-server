import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, createTestPallet, createTestPos, createTestRow, } from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { getPosesByPalletId } from "../getPosesByPalletId.js";
describe("getPosesByPalletId Controller", () => {
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
    it("should return poses by valid palletId", async () => {
        const req = createMockRequest({
            params: { palletId: pallet._id.toString() },
        });
        const res = createMockResponse();
        await getPosesByPalletId(req, res);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]._id.toString()).toBe(pos._id.toString());
    });
    it("should return 400 for invalid palletId", async () => {
        const req = createMockRequest({ params: { palletId: "invalid-id" } });
        const res = createMockResponse();
        await getPosesByPalletId(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe("Invalid pallet ID");
    });
    it("should handle server error", async () => {
        const req = createMockRequest({
            params: { palletId: pallet._id.toString() },
        });
        const res = createMockResponse();
        vi.spyOn(Pos, "find").mockImplementationOnce(() => {
            throw new Error("DB error");
        });
        await getPosesByPalletId(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to fetch poses by pallet");
    });
});
