import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../Art.js";
describe("Art Model - Schema Validation Only", () => {
    beforeEach(async () => {
        await Art.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required artikul field", async () => {
            const artData = { zone: "A1" };
            const art = new Art(artData);
            await expect(art.save()).rejects.toThrow();
        });
        it("should fail without required zone field", async () => {
            const artData = { artikul: "TEST003" };
            const art = new Art(artData);
            await expect(art.save()).rejects.toThrow();
        });
        it("should enforce unique artikul constraint", async () => {
            const artData = { artikul: "DUPLICATE", zone: "A1" };
            await new Art(artData).save();
            await expect(new Art(artData).save()).rejects.toThrow();
        });
        it("should handle special characters in artikul", async () => {
            const artData = { artikul: "SPECIAL-123_ABC", zone: "A1" };
            const art = new Art(artData);
            const savedArt = await art.save();
            expect(savedArt.artikul).toBe("SPECIAL-123_ABC");
        });
        it("should handle unicode characters in names", async () => {
            const artData = {
                artikul: "UNICODE001",
                nameukr: "Українська назва з їїї",
                namerus: "Русское название с ёёё",
                zone: "A1",
            };
            const art = new Art(artData);
            const savedArt = await art.save();
            expect(savedArt.nameukr).toBe("Українська назва з їїї");
            expect(savedArt.namerus).toBe("Русское название с ёёё");
        });
        it("should handle numeric, negative, and decimal limit", async () => {
            const art1 = await new Art({
                artikul: "LIMIT001",
                zone: "A1",
                limit: 0,
            }).save();
            expect(art1.limit).toBe(0);
            const art2 = await new Art({
                artikul: "NEGATIVE001",
                zone: "A1",
                limit: -10,
            }).save();
            expect(art2.limit).toBe(-10);
            const art3 = await new Art({
                artikul: "DECIMAL001",
                zone: "A1",
                limit: 10.5,
            }).save();
            expect(art3.limit).toBe(10.5);
        });
    });
    describe("btradeStock Subdocument", () => {
        it("should save btradeStock with valid data", async () => {
            const artData = {
                artikul: "BTrade001",
                zone: "A1",
                btradeStock: { value: 75, date: new Date("2024-01-15") },
            };
            const art = new Art(artData);
            const savedArt = await art.save();
            expect(savedArt.btradeStock).toBeDefined();
            expect(savedArt.btradeStock?.value).toBe(75);
            expect(savedArt.btradeStock?.date).toBeInstanceOf(Date);
            expect(savedArt.btradeStock?.date.toISOString()).toBe("2024-01-15T00:00:00.000Z");
        });
        it("should use current date when btradeStock date is not provided", async () => {
            const artData = {
                artikul: "BTrade002",
                zone: "A1",
                btradeStock: { value: 100 },
            };
            const art = new Art(artData);
            const savedArt = await art.save();
            expect(savedArt.btradeStock?.date).toBeInstanceOf(Date);
            expect(savedArt.btradeStock?.date.getTime()).toBeGreaterThan(Date.now() - 1000);
        });
        it("should fail btradeStock without required value", async () => {
            const artData = {
                artikul: "BTrade003",
                zone: "A1",
                btradeStock: { date: new Date() },
            };
            const art = new Art(artData);
            await expect(art.save()).rejects.toThrow();
        });
        it("should handle zero and negative btradeStock value", async () => {
            const art1 = await new Art({
                artikul: "BTrade004",
                zone: "A1",
                btradeStock: { value: 0 },
            }).save();
            expect(art1.btradeStock?.value).toBe(0);
            const art2 = await new Art({
                artikul: "BTrade005",
                zone: "A1",
                btradeStock: { value: -5 },
            }).save();
            expect(art2.btradeStock?.value).toBe(-5);
        });
    });
});
