import { beforeEach, describe, expect, it } from "vitest";
import { Pallet } from "../../../../../pallets/models/Pallet.js";
import { Row } from "../../../../models/Row.js";
import { getRowByTitleUtil } from "../getRowByTitleUtil.js";
describe("getRowByTitleUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает null если ряд не найден", async () => {
        const result = await getRowByTitleUtil("NonExistent Row");
        expect(result).toBeNull();
    });
    it("возвращает ряд по title", async () => {
        const row = await Row.create({ title: "Search Test Row" });
        const result = await getRowByTitleUtil("Search Test Row");
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(row._id.toString());
        expect(result?.title).toBe("Search Test Row");
    });
    it("возвращает ряд с паллетами", async () => {
        const row = await Row.create({ title: "Row With Pallets Title" });
        const pallet1 = await Pallet.create({
            title: "1-1",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const pallet2 = await Pallet.create({
            title: "2-1",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const result = await getRowByTitleUtil("Row With Pallets Title");
        expect(result).toBeTruthy();
        expect(result?.pallets).toHaveLength(2);
        // Проверяем сортировку
        expect(result?.pallets[0].title).toBe("1-1");
        expect(result?.pallets[1].title).toBe("2-1");
    });
    it("возвращает правильную структуру данных", async () => {
        const row = await Row.create({ title: "Structure Row" });
        const result = await getRowByTitleUtil("Structure Row");
        expect(result).toBeTruthy();
        expect(result?._id).toBeDefined();
        expect(result?.title).toBe("Structure Row");
        expect(Array.isArray(result?.pallets)).toBe(true);
        expect(result?.createdAt).toBeDefined();
        expect(result?.updatedAt).toBeDefined();
    });
});
