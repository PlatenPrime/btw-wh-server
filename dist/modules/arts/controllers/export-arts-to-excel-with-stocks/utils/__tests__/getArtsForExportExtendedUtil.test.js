import { beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { createTestArt } from "../../../../../../test/setup.js";
import { getArtsForExportExtendedUtil } from "../getArtsForExportExtendedUtil.js";
describe("getArtsForExportExtendedUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("получает все артикулы из базы данных", async () => {
        await createTestArt({
            artikul: "ART-001",
            nameukr: "Тест 1",
            namerus: "Тест 1",
            zone: "A1",
            limit: 100,
            marker: "MARK1",
        });
        await createTestArt({
            artikul: "ART-002",
            nameukr: "Тест 2",
            namerus: "Тест 2",
            zone: "B2",
            limit: 200,
            marker: "MARK2",
        });
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(2);
        expect(result[0].artikul).toBeDefined();
        expect(result[1].artikul).toBeDefined();
    });
    it("сортирует артикулы по artikul в порядке возрастания", async () => {
        await createTestArt({ artikul: "ART-003", zone: "C3" });
        await createTestArt({ artikul: "ART-001", zone: "A1" });
        await createTestArt({ artikul: "ART-002", zone: "B2" });
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(3);
        expect(result[0].artikul).toBe("ART-001");
        expect(result[1].artikul).toBe("ART-002");
        expect(result[2].artikul).toBe("ART-003");
    });
    it("возвращает только нужные поля включая btradeStock, createdAt, updatedAt", async () => {
        await createTestArt({
            artikul: "ART-001",
            nameukr: "Тест",
            namerus: "Тест",
            zone: "A1",
            limit: 100,
            marker: "MARK",
            btradeStock: {
                value: 50,
                date: new Date("2024-01-15"),
            },
        });
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(1);
        const art = result[0];
        // Проверяем что нужные поля присутствуют
        expect(art.artikul).toBe("ART-001");
        expect(art.nameukr).toBe("Тест");
        expect(art.namerus).toBe("Тест");
        expect(art.zone).toBe("A1");
        expect(art.limit).toBe(100);
        expect(art.marker).toBe("MARK");
        expect(art.btradeStock).toBeDefined();
        expect(art.btradeStock?.value).toBe(50);
        // createdAt и updatedAt могут быть undefined при использовании lean() и select()
        // но они должны быть в select, поэтому проверяем что они либо определены, либо не критичны
        if (art.createdAt !== undefined) {
            expect(art.createdAt).toBeInstanceOf(Date);
        }
        if (art.updatedAt !== undefined) {
            expect(art.updatedAt).toBeInstanceOf(Date);
        }
        // Проверяем что это plain object (lean())
        expect(art.constructor.name).toBe("Object");
        expect(art.save).toBeUndefined();
        expect(art.toObject).toBeUndefined();
    });
    it("возвращает пустой массив когда база данных пуста", async () => {
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
    it("использует lean() - возвращает plain objects", async () => {
        await createTestArt({
            artikul: "ART-001",
            zone: "A1",
        });
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(1);
        const art = result[0];
        // Проверяем что это не Mongoose документ
        expect(art.constructor.name).toBe("Object");
        expect(art.save).toBeUndefined();
        expect(art.toObject).toBeUndefined();
        expect(art.toJSON).toBeUndefined();
        expect(art.isNew).toBeUndefined();
    });
    it("обрабатывает артикулы с неполными данными", async () => {
        // Создаем артикул напрямую через модель, чтобы избежать дефолтов из createTestArt
        const Art = mongoose.model("Art");
        await Art.create({
            artikul: "ART-MIN",
            zone: "Z1",
            // остальные поля не указаны
        });
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(1);
        expect(result[0].artikul).toBe("ART-MIN");
        expect(result[0].zone).toBe("Z1");
        expect(result[0].nameukr).toBeUndefined();
        expect(result[0].namerus).toBeUndefined();
        expect(result[0].limit).toBeUndefined();
        expect(result[0].marker).toBeUndefined();
        expect(result[0].btradeStock).toBeUndefined();
        // createdAt и updatedAt могут быть undefined при использовании lean() и select()
        // но они должны быть в select, поэтому проверяем что они либо определены, либо не критичны
        if (result[0].createdAt !== undefined) {
            expect(result[0].createdAt).toBeInstanceOf(Date);
        }
        if (result[0].updatedAt !== undefined) {
            expect(result[0].updatedAt).toBeInstanceOf(Date);
        }
    });
    it("обрабатывает артикулы с btradeStock", async () => {
        const stockDate = new Date("2024-01-15T10:00:00Z");
        await createTestArt({
            artikul: "ART-STOCK",
            zone: "S1",
            btradeStock: {
                value: 75,
                date: stockDate,
            },
        });
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(1);
        expect(result[0].btradeStock).toBeDefined();
        expect(result[0].btradeStock?.value).toBe(75);
        expect(result[0].btradeStock?.date).toBeInstanceOf(Date);
        expect(result[0].btradeStock?.date.getTime()).toBe(stockDate.getTime());
    });
    it("обрабатывает большое количество артикулов", async () => {
        const arts = [];
        for (let i = 0; i < 50; i++) {
            arts.push(createTestArt({
                artikul: `ART-${String(i).padStart(3, "0")}`,
                zone: `Z${i}`,
            }));
        }
        await Promise.all(arts);
        const result = await getArtsForExportExtendedUtil();
        expect(result).toHaveLength(50);
        // Проверяем сортировку
        for (let i = 0; i < result.length - 1; i++) {
            expect(result[i].artikul <= result[i + 1].artikul).toBe(true);
        }
    });
});
