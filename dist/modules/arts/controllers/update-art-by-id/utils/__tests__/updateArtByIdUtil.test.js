import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { updateArtByIdUtil } from "../updateArtByIdUtil.js";
describe("updateArtByIdUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("обновляет только limit", async () => {
        const art = await Art.create({
            artikul: "ART-001",
            zone: "A1",
            limit: 10,
            prodName: "old-prod",
        });
        const result = await updateArtByIdUtil({
            id: art._id.toString(),
            limit: 100,
        });
        expect(result).toBeTruthy();
        expect(result?.limit).toBe(100);
        expect(result?.prodName).toBe("old-prod");
        const found = await Art.findById(art._id);
        expect(found?.limit).toBe(100);
        expect(found?.prodName).toBe("old-prod");
    });
    it("обновляет только prodName", async () => {
        const art = await Art.create({
            artikul: "ART-002",
            zone: "A1",
            limit: 20,
            prodName: "old",
        });
        const result = await updateArtByIdUtil({
            id: art._id.toString(),
            prodName: "new-prod",
        });
        expect(result).toBeTruthy();
        expect(result?.prodName).toBe("new-prod");
        expect(result?.limit).toBe(20);
        const found = await Art.findById(art._id);
        expect(found?.prodName).toBe("new-prod");
        expect(found?.limit).toBe(20);
    });
    it("обновляет limit и prodName одновременно", async () => {
        const art = await Art.create({
            artikul: "ART-003",
            zone: "A1",
            limit: 5,
            prodName: "p1",
        });
        const result = await updateArtByIdUtil({
            id: art._id.toString(),
            limit: 0,
            prodName: "p2",
        });
        expect(result).toBeTruthy();
        expect(result?.limit).toBe(0);
        expect(result?.prodName).toBe("p2");
    });
    it("возвращает null если артикул не найден", async () => {
        const result = await updateArtByIdUtil({
            id: "000000000000000000000000",
            limit: 100,
        });
        expect(result).toBeNull();
    });
    it("возвращает prodName в выбранных полях ответа", async () => {
        const art = await Art.create({
            artikul: "ART-004",
            zone: "A1",
            prodName: "visible",
        });
        const result = await updateArtByIdUtil({
            id: art._id.toString(),
            prodName: "still-visible",
        });
        expect(result?.prodName).toBe("still-visible");
        expect(result?.artikul).toBe("ART-004");
    });
});
