import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { getAnalogsByKonkUtil } from "../getAnalogsByKonkUtil.js";
describe("getAnalogsByKonkUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
    });
    it("returns analogs and pagination for given konkName", async () => {
        await Analog.create([
            { konkName: "acme", prodName: "p1", url: "https://a.com" },
            { konkName: "acme", prodName: "p2", url: "https://b.com" },
            { konkName: "other", prodName: "p1", url: "https://c.com" },
        ]);
        const result = await getAnalogsByKonkUtil({
            konkName: "acme",
            page: 1,
            limit: 10,
        });
        expect(result.analogs).toHaveLength(2);
        expect(result.analogs.every((a) => a.konkName === "acme")).toBe(true);
        expect(result.pagination).toEqual({
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
        });
    });
    it("returns empty analogs and zero total when no match", async () => {
        const result = await getAnalogsByKonkUtil({
            konkName: "nonexistent",
            page: 1,
            limit: 10,
        });
        expect(result.analogs).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
    });
    it("filters by search when provided", async () => {
        await Analog.create([
            { konkName: "acme", prodName: "p", url: "https://a.com", nameukr: "Совпадение" },
            { konkName: "acme", prodName: "p", url: "https://b.com", title: "Other" },
        ]);
        const result = await getAnalogsByKonkUtil({
            konkName: "acme",
            page: 1,
            limit: 10,
            search: "Совпадение",
        });
        expect(result.analogs).toHaveLength(1);
        expect(result.analogs[0].nameukr).toBe("Совпадение");
    });
    it("returns analogs sorted by artikul", async () => {
        await Analog.create([
            { konkName: "acme", prodName: "p", url: "https://c.com", artikul: "C" },
            { konkName: "acme", prodName: "p", url: "https://a.com", artikul: "A" },
        ]);
        const result = await getAnalogsByKonkUtil({
            konkName: "acme",
            page: 1,
            limit: 10,
        });
        expect(result.analogs.map((a) => a.artikul)).toEqual(["A", "C"]);
    });
});
