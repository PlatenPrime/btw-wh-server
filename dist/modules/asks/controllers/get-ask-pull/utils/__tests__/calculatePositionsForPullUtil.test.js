import { describe, expect, it } from "vitest";
import { createTestPos } from "../../../../../../test/setup.js";
import { calculatePositionsForPullUtil } from "../calculatePositionsForPullUtil.js";
describe("calculatePositionsForPullUtil", () => {
    it("возвращает одну позицию с наименьшим сектором когда quant не указан (remainingQuantity === null)", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 10,
        });
        pos1.palletData = { ...pos1.palletData, sector: 2 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-1",
            quant: 5,
        });
        pos2.palletData = { ...pos2.palletData, sector: 1 };
        await pos2.save();
        const pos3 = await createTestPos({
            artikul: "ART-1",
            quant: 8,
        });
        pos3.palletData = { ...pos3.palletData, sector: 3 };
        await pos3.save();
        const positions = [pos1, pos2, pos3];
        const result = calculatePositionsForPullUtil(positions, null, // remainingQuantity === null
        "ask1", "ART-1", null, null);
        expect(result.length).toBe(1);
        expect(result[0].plannedQuant).toBeNull();
        expect(result[0].askId).toBe("ask1");
        expect(result[0].askArtikul).toBe("ART-1");
        // Должна быть выбрана позиция с наименьшим сектором (sector 1)
        // sector может быть строкой или числом
        expect(Number(result[0].palletData.sector)).toBe(1);
    });
    it("распределяет количество между позициями когда quant указан", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 5,
        });
        pos1.palletData = { ...pos1.palletData, sector: 1 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-1",
            quant: 3,
        });
        pos2.palletData = { ...pos2.palletData, sector: 2 };
        await pos2.save();
        const pos3 = await createTestPos({
            artikul: "ART-1",
            quant: 10,
        });
        pos3.palletData = { ...pos3.palletData, sector: 3 };
        await pos3.save();
        const positions = [pos1, pos2, pos3];
        const result = calculatePositionsForPullUtil(positions, 8, // remainingQuantity = 8
        "ask1", "ART-1", 10, 8);
        expect(result.length).toBe(2); // Должно хватить на первые 2 позиции
        expect(result[0].plannedQuant).toBe(5); // Вся первая позиция
        expect(result[1].plannedQuant).toBe(3); // Вся вторая позиция
        expect(result[0].askId).toBe("ask1");
        expect(result[0].askArtikul).toBe("ART-1");
        expect(result[0].askQuant).toBe(10);
        expect(result[0].askRemainingQuantity).toBe(8);
    });
    it("обрабатывает пустой массив позиций", () => {
        const result = calculatePositionsForPullUtil([], 10, "ask1", "ART-1", 10, 10);
        expect(result).toEqual([]);
    });
    it("сортирует позиции по сектору паллеты", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 5,
        });
        pos1.palletData = { ...pos1.palletData, sector: 3 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-1",
            quant: 3,
        });
        pos2.palletData = { ...pos2.palletData, sector: 1 };
        await pos2.save();
        const pos3 = await createTestPos({
            artikul: "ART-1",
            quant: 10,
        });
        pos3.palletData = { ...pos3.palletData, sector: 2 };
        await pos3.save();
        const positions = [pos1, pos2, pos3];
        const result = calculatePositionsForPullUtil(positions, 15, "ask1", "ART-1", 15, 15);
        // Позиции должны быть отсортированы по сектору
        // sector может быть строкой или числом
        expect(Number(result[0].palletData.sector)).toBe(1);
        expect(Number(result[1].palletData.sector)).toBe(2);
        expect(Number(result[2].palletData.sector)).toBe(3);
    });
    it("обрабатывает позиции с quant <= 0", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 0,
        });
        pos1.palletData = { ...pos1.palletData, sector: 1 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-1",
            quant: -5,
        });
        pos2.palletData = { ...pos2.palletData, sector: 2 };
        await pos2.save();
        const pos3 = await createTestPos({
            artikul: "ART-1",
            quant: 10,
        });
        pos3.palletData = { ...pos3.palletData, sector: 3 };
        await pos3.save();
        const positions = [pos1, pos2, pos3];
        const result = calculatePositionsForPullUtil(positions, 10, "ask1", "ART-1", 10, 10);
        // Только позиция с quant > 0 должна быть включена
        expect(result.length).toBe(1);
        expect(result[0].quant).toBe(10);
    });
    it("возвращает пустой массив когда все позиции имеют quant <= 0 и quant не указан", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 0,
        });
        pos1.palletData = { ...pos1.palletData, sector: 1 };
        await pos1.save();
        const positions = [pos1];
        const result = calculatePositionsForPullUtil(positions, null, "ask1", "ART-1", null, null);
        expect(result).toEqual([]);
    });
    it("распределяет частичное количество когда одной позиции недостаточно", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 3,
        });
        pos1.palletData = { ...pos1.palletData, sector: 1 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-1",
            quant: 5,
        });
        pos2.palletData = { ...pos2.palletData, sector: 2 };
        await pos2.save();
        const positions = [pos1, pos2];
        const result = calculatePositionsForPullUtil(positions, 7, // remainingQuantity = 7
        "ask1", "ART-1", 7, 7);
        expect(result.length).toBe(2);
        expect(result[0].plannedQuant).toBe(3); // Вся первая позиция
        expect(result[1].plannedQuant).toBe(4); // Часть второй позиции (не вся)
    });
    it("возвращает все доступные позиции даже если их недостаточно для покрытия всего количества", async () => {
        const pos1 = await createTestPos({
            artikul: "ART-1",
            quant: 3,
        });
        pos1.palletData = { ...pos1.palletData, sector: 1 };
        await pos1.save();
        const pos2 = await createTestPos({
            artikul: "ART-1",
            quant: 2,
        });
        pos2.palletData = { ...pos2.palletData, sector: 2 };
        await pos2.save();
        const positions = [pos1, pos2];
        const result = calculatePositionsForPullUtil(positions, 10, // remainingQuantity = 10, но доступно только 5
        "ask1", "ART-1", 10, 10);
        expect(result.length).toBe(2);
        expect(result[0].plannedQuant).toBe(3);
        expect(result[1].plannedQuant).toBe(2);
    });
});
