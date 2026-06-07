import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Zone } from "../Zone.js";
describe("Zone Model", () => {
    beforeEach(async () => {
        await Zone.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required title", async () => {
            const zone = new Zone({ bar: 420101, sector: 0 });
            await expect(zone.save()).rejects.toThrow();
        });
        it("should fail without required bar", async () => {
            const zone = new Zone({ title: "42-1", sector: 0 });
            await expect(zone.save()).rejects.toThrow();
        });
        it("should fail when title format is invalid", async () => {
            const zone = new Zone({ title: "invalid-title", bar: 420101, sector: 0 });
            await expect(zone.save()).rejects.toThrow();
        });
        it("should fail when bar is less than 1", async () => {
            const zone = new Zone({ title: "42-1", bar: 0, sector: 0 });
            await expect(zone.save()).rejects.toThrow();
        });
        it("should save with all required fields", async () => {
            const saved = await Zone.create({
                title: "42-5",
                bar: 4205,
                sector: 0,
            });
            expect(saved.title).toBe("42-5");
            expect(saved.bar).toBe(4205);
            expect(saved.sector).toBe(0);
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should enforce unique title", async () => {
            await Zone.create({ title: "42-1", bar: 4201, sector: 0 });
            const duplicate = new Zone({ title: "42-1", bar: 9999, sector: 0 });
            await expect(duplicate.save()).rejects.toThrow();
        });
        it("should enforce unique bar", async () => {
            await Zone.create({ title: "42-1", bar: 4201, sector: 0 });
            const duplicate = new Zone({ title: "42-2", bar: 4201, sector: 0 });
            await expect(duplicate.save()).rejects.toThrow();
        });
        it("should accept optional seg subdocument", async () => {
            const segId = new mongoose.Types.ObjectId();
            const saved = await Zone.create({
                title: "42-3",
                bar: 4203,
                sector: 100,
                seg: { id: segId, title: "Seg 1" },
            });
            expect(saved.seg?.id.toString()).toBe(segId.toString());
            expect(saved.seg?.title).toBe("Seg 1");
        });
    });
});
