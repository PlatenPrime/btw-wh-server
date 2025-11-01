import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { getAllZonesUtil } from "../getAllZonesUtil.js";
describe("getAllZonesUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает все зоны отсортированные по sector", async () => {
        await Zone.create({ title: "2-1", bar: 2010, sector: 2 });
        await Zone.create({ title: "1-1", bar: 1010, sector: 1 });
        await Zone.create({ title: "3-1", bar: 3010, sector: 3 });
        const result = await getAllZonesUtil({
            page: 1,
            limit: 10,
            search: "",
            sortBy: "sector",
            sortOrder: "asc",
        });
        expect(result.zones).toHaveLength(3);
        expect(result.zones[0].sector).toBe(1);
        expect(result.zones[1].sector).toBe(2);
        expect(result.zones[2].sector).toBe(3);
    });
    it("возвращает зоны с пагинацией", async () => {
        await Zone.create({ title: "1-1", bar: 1010, sector: 0 });
        await Zone.create({ title: "2-2", bar: 2020, sector: 0 });
        await Zone.create({ title: "3-3", bar: 3030, sector: 0 });
        const result = await getAllZonesUtil({
            page: 1,
            limit: 2,
            search: "",
            sortBy: "title",
            sortOrder: "asc",
        });
        expect(result.zones).toHaveLength(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(2);
        expect(result.pagination.total).toBe(3);
        expect(result.pagination.totalPages).toBe(2);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(false);
    });
    it("возвращает результаты поиска по title", async () => {
        await Zone.create({ title: "10-1", bar: 1110, sector: 0 });
        await Zone.create({ title: "20-2", bar: 2220, sector: 0 });
        await Zone.create({ title: "10-3", bar: 3330, sector: 0 });
        const result = await getAllZonesUtil({
            page: 1,
            limit: 10,
            search: "10",
            sortBy: "title",
            sortOrder: "asc",
        });
        expect(result.zones).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
    });
    it("возвращает пустой массив когда зон нет", async () => {
        const result = await getAllZonesUtil({
            page: 1,
            limit: 10,
            search: "",
            sortBy: "sector",
            sortOrder: "asc",
        });
        expect(result.zones).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
    });
});
