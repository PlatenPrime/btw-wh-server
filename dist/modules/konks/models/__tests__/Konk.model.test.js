import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../Konk.js";
describe("Konk Model", () => {
    beforeEach(async () => {
        await Konk.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required name field", async () => {
            const konkData = {
                title: "Title",
                url: "https://example.com",
                imageUrl: "https://example.com/img.png",
            };
            const konk = new Konk(konkData);
            await expect(konk.save()).rejects.toThrow();
        });
        it("should fail without required title field", async () => {
            const konkData = {
                name: "key",
                url: "https://example.com",
                imageUrl: "https://example.com/img.png",
            };
            const konk = new Konk(konkData);
            await expect(konk.save()).rejects.toThrow();
        });
        it("should fail without required url field", async () => {
            const konkData = {
                name: "key",
                title: "Title",
                imageUrl: "https://example.com/img.png",
            };
            const konk = new Konk(konkData);
            await expect(konk.save()).rejects.toThrow();
        });
        it("should fail without required imageUrl field", async () => {
            const konkData = {
                name: "key",
                title: "Title",
                url: "https://example.com",
            };
            const konk = new Konk(konkData);
            await expect(konk.save()).rejects.toThrow();
        });
        it("should save with all required fields", async () => {
            const konkData = {
                name: "acme",
                title: "Acme Corp",
                url: "https://example.com",
                imageUrl: "https://example.com/acme.png",
            };
            const konk = new Konk(konkData);
            const saved = await konk.save();
            expect(saved.name).toBe("acme");
            expect(saved.title).toBe("Acme Corp");
            expect(saved.url).toBe("https://example.com");
            expect(saved.imageUrl).toBe("https://example.com/acme.png");
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should have timestamps", async () => {
            const konk = new Konk({
                name: "x",
                title: "X",
                url: "https://x.com",
                imageUrl: "https://x.com/1.png",
            });
            const saved = await konk.save();
            expect(saved.createdAt).toBeDefined();
            expect(saved.updatedAt).toBeDefined();
        });
        it("should enforce unique name", async () => {
            await Konk.create({
                name: "dup",
                title: "First",
                url: "https://a.com",
                imageUrl: "https://a.com/1.png",
            });
            const second = new Konk({
                name: "dup",
                title: "Second",
                url: "https://a.com",
                imageUrl: "https://a.com/2.png",
            });
            await expect(second.save()).rejects.toThrow();
        });
    });
});
