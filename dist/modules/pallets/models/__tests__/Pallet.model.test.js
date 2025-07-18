import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup";
import { Pallet } from "../Pallet.js";
const createTestRow = (overrides = {}) => ({
    _id: new Types.ObjectId(),
    title: "Test Row",
    ...overrides,
});
describe("Pallet Model - Schema Validation Only", () => {
    beforeEach(async () => {
        await Pallet.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required title", async () => {
            const pallet = new Pallet({ row: createTestRow() });
            await expect(pallet.save()).rejects.toThrow();
        });
        it("should fail without required row", async () => {
            const pallet = new Pallet({ title: "No Row" });
            await expect(pallet.save()).rejects.toThrow();
        });
        it("should fail if row is missing _id or title", async () => {
            const pallet1 = new Pallet({ title: "Bad Row", row: { title: "No ID" } });
            await expect(pallet1.save()).rejects.toThrow();
            const pallet2 = new Pallet({
                title: "Bad Row",
                row: { _id: new Types.ObjectId() },
            });
            await expect(pallet2.save()).rejects.toThrow();
        });
        it("should handle unicode and special characters in title", async () => {
            const row = createTestRow();
            const pallet = await Pallet.create({
                title: "Юникод-测试-!@#",
                row,
                rowData: { _id: row._id, title: row.title },
            });
            expect(pallet.title).toBe("Юникод-测试-!@#");
        });
        it("should allow empty poses array", async () => {
            const row = createTestRow();
            const pallet = await Pallet.create({
                title: "EmptyPoses",
                row,
                rowData: { _id: row._id, title: row.title },
                poses: [],
            });
            expect(Array.isArray(pallet.poses)).toBe(true);
            expect(pallet.poses).toHaveLength(0);
        });
        it("should allow missing sector", async () => {
            const row = createTestRow();
            const pallet = await Pallet.create({
                title: "NoSector",
                row,
                rowData: { _id: row._id, title: row.title },
            });
            expect(pallet.sector).toBeUndefined();
        });
        it("should allow rowData to be different from row", async () => {
            const rowId = new Types.ObjectId();
            const pallet = await Pallet.create({
                title: "Test Pallet",
                row: rowId,
                rowData: { _id: rowId, title: "Test Row" },
                poses: [],
            });
            expect(pallet.rowData._doc).toEqual({
                _id: rowId,
                title: "Test Row",
            });
        });
    });
});
