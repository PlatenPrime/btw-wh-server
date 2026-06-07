import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Block } from "../Block.js";
describe("Block Model", () => {
    beforeEach(async () => {
        await Block.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required title", async () => {
            const block = new Block({ order: 1, segs: [] });
            await expect(block.save()).rejects.toThrow();
        });
        it("should fail without required order", async () => {
            const block = new Block({ title: "Block A", segs: [] });
            await expect(block.save()).rejects.toThrow();
        });
        it("should fail when order is less than 1", async () => {
            const block = new Block({ title: "Block A", order: 0, segs: [] });
            await expect(block.save()).rejects.toThrow();
        });
        it("should save with all required fields", async () => {
            const saved = await Block.create({
                title: "Block A",
                order: 1,
                segs: [],
            });
            expect(saved.title).toBe("Block A");
            expect(saved.order).toBe(1);
            expect(saved.segs).toEqual([]);
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should enforce unique title", async () => {
            await Block.create({ title: "Unique Block", order: 1, segs: [] });
            const duplicate = new Block({ title: "Unique Block", order: 2, segs: [] });
            await expect(duplicate.save()).rejects.toThrow();
        });
        it("should accept segs array of ObjectIds", async () => {
            const saved = await Block.create({
                title: "Block With Segs",
                order: 1,
                segs: [],
            });
            expect(Array.isArray(saved.segs)).toBe(true);
        });
    });
});
