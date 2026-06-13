import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../prods/models/Prod.js";
import { isAllProd, loadProdDisplayTitlesByName, } from "../prodDisplayTitles.js";
describe("prodDisplayTitles", () => {
    beforeEach(async () => {
        await Prod.deleteMany({});
    });
    describe("isAllProd", () => {
        it("returns true only for exact all after trim", () => {
            expect(isAllProd("all")).toBe(true);
            expect(isAllProd("  all  ")).toBe(true);
            expect(isAllProd("ALL")).toBe(false);
            expect(isAllProd("gemar")).toBe(false);
            expect(isAllProd(undefined)).toBe(false);
        });
    });
    describe("loadProdDisplayTitlesByName", () => {
        it("returns Prod.title when document exists", async () => {
            await Prod.create({
                name: "gemar",
                title: "Gemar Title",
                imageUrl: "https://example.com/g.png",
            });
            const map = await loadProdDisplayTitlesByName(["gemar"]);
            expect(map.get("gemar")).toBe("Gemar Title");
        });
        it("falls back to name when Prod document missing", async () => {
            const map = await loadProdDisplayTitlesByName(["unknown-prod"]);
            expect(map.get("unknown-prod")).toBe("unknown-prod");
        });
        it("deduplicates names and trims input", async () => {
            await Prod.create({
                name: "p1",
                title: "P One",
                imageUrl: "https://example.com/p1.png",
            });
            const map = await loadProdDisplayTitlesByName([" p1 ", "p1", "p2"]);
            expect(map.size).toBe(2);
            expect(map.get("p1")).toBe("P One");
            expect(map.get("p2")).toBe("p2");
        });
    });
});
