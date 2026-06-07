import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Row } from "../Row.js";
describe("Row Model", () => {
    beforeEach(async () => {
        await Row.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required title", async () => {
            const row = new Row({ pallets: [] });
            await expect(row.save()).rejects.toThrow();
        });
        it("should save with required title", async () => {
            const saved = await Row.create({ title: "Row A", pallets: [] });
            expect(saved.title).toBe("Row A");
            expect(saved.pallets).toEqual([]);
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should enforce unique title", async () => {
            await Row.create({ title: "Unique Row", pallets: [] });
            const duplicate = new Row({ title: "Unique Row", pallets: [] });
            await expect(duplicate.save()).rejects.toThrow();
        });
        it("should accept pallets array of ObjectIds", async () => {
            const saved = await Row.create({
                title: "Row With Pallets",
                pallets: [],
            });
            expect(saved.pallets).toEqual([]);
        });
    });
});
