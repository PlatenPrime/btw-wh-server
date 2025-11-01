import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { getAllArtsUtil } from "../getAllArtsUtil.js";
describe("getAllArtsUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает все артикулы отсортированные по artikul", async () => {
        await Art.create({ artikul: "ART-002", zone: "A2" });
        await Art.create({ artikul: "ART-001", zone: "A1" });
        await Art.create({ artikul: "ART-003", zone: "A3" });
        const result = await getAllArtsUtil({
            page: 1,
            limit: 10,
            search: "",
        });
        expect(result.arts).toHaveLength(3);
        expect(result.arts[0].artikul).toBe("ART-001");
        expect(result.arts[1].artikul).toBe("ART-002");
        expect(result.arts[2].artikul).toBe("ART-003");
    });
    it("возвращает артикулы с пагинацией", async () => {
        await Art.create({ artikul: "ART-001", zone: "A1" });
        await Art.create({ artikul: "ART-002", zone: "A2" });
        await Art.create({ artikul: "ART-003", zone: "A3" });
        const result = await getAllArtsUtil({
            page: 1,
            limit: 2,
            search: "",
        });
        expect(result.arts).toHaveLength(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(2);
        expect(result.pagination.total).toBe(3);
        expect(result.pagination.totalPages).toBe(2);
    });
    it("возвращает результаты поиска по artikul", async () => {
        await Art.create({ artikul: "ABC-001", zone: "A1" });
        await Art.create({ artikul: "XYZ-001", zone: "A2" });
        await Art.create({ artikul: "ABC-002", zone: "A3" });
        const result = await getAllArtsUtil({
            page: 1,
            limit: 10,
            search: "ABC",
        });
        expect(result.arts).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
    });
    it("возвращает результаты поиска по nameukr", async () => {
        await Art.create({
            artikul: "ART-001",
            nameukr: "Українська назва",
            zone: "A1",
        });
        await Art.create({
            artikul: "ART-002",
            nameukr: "Інша назва",
            zone: "A2",
        });
        const result = await getAllArtsUtil({
            page: 1,
            limit: 10,
            search: "українська",
        });
        expect(result.arts).toHaveLength(1);
        expect(result.arts[0].nameukr).toBe("Українська назва");
    });
    it("возвращает результаты поиска по namerus", async () => {
        await Art.create({
            artikul: "ART-001",
            namerus: "Русское название",
            zone: "A1",
        });
        await Art.create({
            artikul: "ART-002",
            namerus: "Другое название",
            zone: "A2",
        });
        const result = await getAllArtsUtil({
            page: 1,
            limit: 10,
            search: "русское",
        });
        expect(result.arts).toHaveLength(1);
        expect(result.arts[0].namerus).toBe("Русское название");
    });
    it("возвращает пустой массив когда артикулов нет", async () => {
        const result = await getAllArtsUtil({
            page: 1,
            limit: 10,
            search: "",
        });
        expect(result.arts).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
    });
});
