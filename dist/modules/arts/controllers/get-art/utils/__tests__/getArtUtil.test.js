import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { getArtUtil } from "../getArtUtil.js";
describe("getArtUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает null если артикул не найден", async () => {
        const result = await getArtUtil("NonExistent Artikul");
        expect(result).toBeNull();
    });
    it("возвращает артикул по artikul", async () => {
        await Art.create({ artikul: "ART-001", zone: "A1" });
        const result = await getArtUtil("ART-001");
        expect(result).toBeTruthy();
        expect(result?.artikul).toBe("ART-001");
        expect(result?.zone).toBe("A1");
    });
    it("возвращает артикул с дополнительными полями", async () => {
        await Art.create({
            artikul: "ART-002",
            nameukr: "Українська назва",
            namerus: "Русское название",
            zone: "A2",
            limit: 100,
            marker: "TEST",
        });
        const result = await getArtUtil("ART-002");
        expect(result).toBeTruthy();
        expect(result?.nameukr).toBe("Українська назва");
        expect(result?.namerus).toBe("Русское название");
        expect(result?.limit).toBe(100);
        expect(result?.marker).toBe("TEST");
    });
});
