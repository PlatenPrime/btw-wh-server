import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { updateArtLimitUtil } from "../updateArtLimitUtil.js";
describe("updateArtLimitUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("обновляет limit артикула и возвращает обновлённый документ", async () => {
        const art = await Art.create({ artikul: "ART-001", zone: "A1", limit: 10 });
        const result = await updateArtLimitUtil({
            id: art._id.toString(),
            limit: 100,
        });
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(art._id.toString());
        expect(result?.limit).toBe(100);
        const found = await Art.findById(art._id);
        expect(found?.limit).toBe(100);
    });
    it("возвращает null если артикул не найден", async () => {
        const nonExistentId = "000000000000000000000000";
        const result = await updateArtLimitUtil({
            id: nonExistentId,
            limit: 100,
        });
        expect(result).toBeNull();
    });
    it("обновляет limit на 0", async () => {
        const art = await Art.create({ artikul: "ART-002", zone: "A1", limit: 100 });
        const result = await updateArtLimitUtil({
            id: art._id.toString(),
            limit: 0,
        });
        expect(result).toBeTruthy();
        expect(result?.limit).toBe(0);
    });
    it("возвращает только выбранные поля", async () => {
        const art = await Art.create({
            artikul: "ART-003",
            zone: "A1",
            limit: 50,
        });
        const result = await updateArtLimitUtil({
            id: art._id.toString(),
            limit: 75,
        });
        expect(result).toBeTruthy();
        expect(result?.artikul).toBe("ART-003");
        expect(result?.zone).toBe("A1");
        expect(result?.limit).toBe(75);
        expect(result?.createdAt).toBeDefined();
        expect(result?.updatedAt).toBeDefined();
    });
});
