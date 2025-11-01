import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../../../models/Row.js";
import { createRowUtil } from "../createRowUtil.js";
describe("createRowUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("создаёт Row и возвращает сохранённый документ", async () => {
        const result = await createRowUtil({ title: "Test Row A" });
        expect(result).toBeTruthy();
        expect(result._id).toBeDefined();
        expect(result.title).toBe("Test Row A");
        const found = await Row.findById(result._id);
        expect(found).not.toBeNull();
        expect(found?.title).toBe("Test Row A");
    });
    it("создаёт Row с уникальным title", async () => {
        const result1 = await createRowUtil({ title: "Unique Row" });
        expect(result1.title).toBe("Unique Row");
        // Попытка создать дубликат должна выбрасывать ошибку
        await expect(createRowUtil({ title: "Unique Row" })).rejects.toThrow();
        const found = await Row.find({ title: "Unique Row" });
        expect(found).toHaveLength(1);
    });
    it("добавляет timestamps автоматически", async () => {
        const result = await createRowUtil({ title: "Timestamp Row" });
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });
});
