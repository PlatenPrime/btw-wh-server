import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, createMockResponse, createTestPallet, createTestPos, createTestRow, } from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { getAllPoses } from "../getAllPoses.js";
// Мокаем консоль для ошибок
vi.spyOn(console, "error").mockImplementation(() => { });
describe("getAllPoses Controller", () => {
    let row;
    let pallet;
    beforeEach(async () => {
        row = await createTestRow();
        pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
    });
    it("should return all poses with default pagination", async () => {
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            artikul: "A-1",
        });
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            artikul: "A-2",
        });
        const req = createMockRequest({ query: {} });
        const res = createMockResponse();
        await getAllPoses(req, res);
        expect(res.statusCode).toBeUndefined();
        expect(res.body.data).toHaveLength(2);
        expect(res.body.total).toBe(2);
        expect(res.body.page).toBe(1);
        expect(res.body.totalPages).toBe(1);
    });
    it("should filter by artikul", async () => {
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            artikul: "FILTER-1",
        });
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            artikul: "NOPE",
        });
        const req = createMockRequest({ query: { artikul: "FILTER" } });
        const res = createMockResponse();
        await getAllPoses(req, res);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].artikul).toBe("FILTER-1");
    });
    it("should filter by palletId", async () => {
        const otherPallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
        });
        await createTestPos({
            pallet: { _id: otherPallet._id, title: otherPallet.title },
            row: { _id: row._id, title: row.title },
        });
        const req = createMockRequest({
            query: { palletId: pallet._id.toString() },
        });
        const res = createMockResponse();
        await getAllPoses(req, res);
        expect(res.body.data.every((p) => p.pallet._id.toString() === pallet._id.toString())).toBe(true);
    });
    it("should return empty array if no poses", async () => {
        const req = createMockRequest({ query: {} });
        const res = createMockResponse();
        await getAllPoses(req, res);
        expect(res.body.data).toHaveLength(0);
        expect(res.body.total).toBe(0);
    });
    it("should handle server error", async () => {
        const req = createMockRequest({ query: {} });
        const res = createMockResponse();
        vi.spyOn(Pos, "find").mockImplementationOnce(() => {
            throw new Error("DB error");
        });
        await getAllPoses(req, res);
        expect(res.statusCode).toBe(500);
        expect(res.body.error).toBe("Failed to fetch poses");
    });
});
