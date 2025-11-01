import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../../../models/Row.js";
import { getAllRowsUtil } from "../getAllRowsUtil.js";
describe("getAllRowsUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает все ряды отсортированные по title", async () => {
        await Row.create({ title: "B Row" });
        await Row.create({ title: "A Row" });
        await Row.create({ title: "C Row" });
        const result = await getAllRowsUtil();
        expect(result).toHaveLength(3);
        expect(result[0].title).toBe("A Row");
        expect(result[1].title).toBe("B Row");
        expect(result[2].title).toBe("C Row");
    });
    it("возвращает пустой массив когда рядов нет", async () => {
        const result = await getAllRowsUtil();
        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });
    it("возвращает ряды с правильной структурой", async () => {
        const createdRow = await Row.create({ title: "Structure Test" });
        const result = await getAllRowsUtil();
        expect(result).toHaveLength(1);
        expect(result[0]._id).toBeDefined();
        expect(result[0].title).toBe("Structure Test");
        expect(result[0].pallets).toBeDefined();
        expect(Array.isArray(result[0].pallets)).toBe(true);
        expect(result[0].createdAt).toBeDefined();
        expect(result[0].updatedAt).toBeDefined();
    });
});
