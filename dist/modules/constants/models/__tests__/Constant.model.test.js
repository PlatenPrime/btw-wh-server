import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../Constant.js";
describe("Constant Model", () => {
    beforeEach(async () => {
        await Constant.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required name field", async () => {
            const constantData = {
                title: "My Constants",
                data: { key1: "value1" },
            };
            const constant = new Constant(constantData);
            await expect(constant.save()).rejects.toThrow();
        });
        it("should fail without required title field", async () => {
            const constantData = {
                name: "mykey",
                data: { key1: "value1" },
            };
            const constant = new Constant(constantData);
            await expect(constant.save()).rejects.toThrow();
        });
        it("should save with all required fields and empty data", async () => {
            const constantData = {
                name: "slug",
                title: "My Collection",
            };
            const constant = new Constant(constantData);
            const saved = await constant.save();
            expect(saved.name).toBe("slug");
            expect(saved.title).toBe("My Collection");
            expect(saved.data).toEqual({});
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should save with data object (string keys and values)", async () => {
            const constantData = {
                name: "config",
                title: "Config Values",
                data: { foo: "bar", baz: "qux" },
            };
            const constant = new Constant(constantData);
            const saved = await constant.save();
            expect(saved.name).toBe("config");
            expect(saved.title).toBe("Config Values");
            expect(saved.data).toEqual({ foo: "bar", baz: "qux" });
            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });
        it("should have timestamps", async () => {
            const constant = new Constant({
                name: "x",
                title: "X",
                data: {},
            });
            const saved = await constant.save();
            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });
        it("should enforce unique name", async () => {
            await Constant.create({
                name: "dup",
                title: "First",
                data: {},
            });
            const second = new Constant({
                name: "dup",
                title: "Second",
                data: {},
            });
            await expect(second.save()).rejects.toThrow();
        });
        it("should reject data with non-string values", async () => {
            const constant = new Constant({
                name: "bad",
                title: "Bad",
                data: { key: 123 },
            });
            await expect(constant.save()).rejects.toThrow();
        });
    });
});
