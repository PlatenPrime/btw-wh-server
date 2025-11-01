import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { getArtsByZoneUtil } from "../getArtsByZoneUtil.js";
describe("getArtsByZoneUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает пустой массив если артикулов в зоне нет", async () => {
        const result = await getArtsByZoneUtil("NONEXISTENT");
        expect(result).toEqual([]);
    });
    it("возвращает артикулы отсортированные по artikul", async () => {
        await Art.create({ artikul: "ART-003", zone: "A1" });
        await Art.create({ artikul: "ART-001", zone: "A1" });
        await Art.create({ artikul: "ART-002", zone: "A1" });
        const result = await getArtsByZoneUtil("A1");
        expect(result).toHaveLength(3);
        expect(result[0].artikul).toBe("ART-001");
        expect(result[1].artikul).toBe("ART-002");
        expect(result[2].artikul).toBe("ART-003");
    });
    it("возвращает только артикулы указанной зоны", async () => {
        await Art.create({ artikul: "ART-A1", zone: "A1" });
        await Art.create({ artikul: "ART-A2", zone: "A2" });
        await Art.create({ artikul: "ART-A1-2", zone: "A1" });
        const result = await getArtsByZoneUtil("A1");
        expect(result).toHaveLength(2);
        expect(result.every((art) => art.zone === "A1")).toBe(true);
    });
});
