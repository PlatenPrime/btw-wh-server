import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogsUtil } from "../getAnalogsUtil.js";
describe("getAnalogsUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
    });
    it("returns paginated analogs and pagination info", async () => {
        await Analog.create([
            { konkName: "k1", prodName: "p1", url: "https://a.com" },
            { konkName: "k1", prodName: "p1", url: "https://b.com" },
            { konkName: "k2", prodName: "p1", url: "https://c.com" },
        ]);
        const result = await getAnalogsUtil({ page: 1, limit: 2 });
        expect(result.analogs).toHaveLength(2);
        expect(result.pagination).toEqual({
            page: 1,
            limit: 2,
            total: 3,
            totalPages: 2,
            hasNext: true,
            hasPrev: false,
        });
    });
    it("filters by konkName when provided", async () => {
        await Analog.create([
            { konkName: "acme", prodName: "p", url: "https://a.com" },
            { konkName: "other", prodName: "p", url: "https://b.com" },
        ]);
        const result = await getAnalogsUtil({
            konkName: "acme",
            page: 1,
            limit: 10,
        });
        expect(result.analogs).toHaveLength(1);
        expect(result.analogs[0].konkName).toBe("acme");
        expect(result.pagination.total).toBe(1);
    });
    it("filters by prodName when provided", async () => {
        await Analog.create([
            { konkName: "k", prodName: "maker", url: "https://a.com" },
            { konkName: "k", prodName: "other", url: "https://b.com" },
        ]);
        const result = await getAnalogsUtil({
            prodName: "maker",
            page: 1,
            limit: 10,
        });
        expect(result.analogs).toHaveLength(1);
        expect(result.analogs[0].prodName).toBe("maker");
    });
    it("returns empty list when no analogs match", async () => {
        const result = await getAnalogsUtil({ page: 1, limit: 10 });
        expect(result.analogs).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.totalPages).toBe(0);
    });
    it("filters by search (nameukr and title) when provided", async () => {
        await Analog.create([
            { konkName: "k", prodName: "p", url: "https://a.com", nameukr: "Товар один" },
            { konkName: "k", prodName: "p", url: "https://b.com", title: "Product two" },
            { konkName: "k", prodName: "p", url: "https://c.com", nameukr: "Other" },
        ]);
        const result = await getAnalogsUtil({
            page: 1,
            limit: 10,
            search: "Товар",
        });
        expect(result.analogs).toHaveLength(1);
        expect(result.analogs[0].nameukr).toBe("Товар один");
        const byTitle = await getAnalogsUtil({
            page: 1,
            limit: 10,
            search: "two",
        });
        expect(byTitle.analogs).toHaveLength(1);
        expect(byTitle.analogs[0].title).toBe("Product two");
    });
    it("returns analogs sorted by artikul", async () => {
        await Analog.create([
            { konkName: "k", prodName: "p", url: "https://c.com", artikul: "C" },
            { konkName: "k", prodName: "p", url: "https://a.com", artikul: "A" },
            { konkName: "k", prodName: "p", url: "https://b.com", artikul: "B" },
        ]);
        const result = await getAnalogsUtil({ page: 1, limit: 10 });
        expect(result.analogs.map((a) => a.artikul)).toEqual(["A", "B", "C"]);
    });
});
