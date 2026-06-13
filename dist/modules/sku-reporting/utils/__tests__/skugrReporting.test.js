import { describe, expect, it } from "vitest";
import { buildSliceMapsByKonk, getSliceItem } from "../skugrReporting.js";
describe("skugrReporting slice maps", () => {
    it("getSliceItem reads konk, date and productId", () => {
        const d = new Date("2026-01-05T00:00:00.000Z");
        const maps = buildSliceMapsByKonk([
            {
                konkName: "k1",
                date: d,
                data: { pid1: { stock: 1, price: 2 } },
            },
        ]);
        const item = getSliceItem(maps, "k1", "pid1", d);
        expect(item).toEqual({ stock: 1, price: 2 });
        expect(getSliceItem(maps, "k1", "missing", d)).toBeUndefined();
        expect(getSliceItem(maps, "k2", "pid1", d)).toBeUndefined();
    });
    it("keeps separate maps per konkName", () => {
        const d = new Date("2026-02-01T00:00:00.000Z");
        const maps = buildSliceMapsByKonk([
            {
                konkName: "a",
                date: d,
                data: { p: { stock: 1, price: 1 } },
            },
            {
                konkName: "b",
                date: d,
                data: { p: { stock: 2, price: 2 } },
            },
        ]);
        expect(getSliceItem(maps, "a", "p", d)?.stock).toBe(1);
        expect(getSliceItem(maps, "b", "p", d)?.stock).toBe(2);
    });
});
