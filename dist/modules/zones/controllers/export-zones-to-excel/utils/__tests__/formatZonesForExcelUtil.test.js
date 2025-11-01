import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { formatZonesForExcelUtil } from "../formatZonesForExcelUtil.js";
describe("formatZonesForExcelUtil", () => {
    it("форматирует зоны для Excel экспорта", () => {
        const zones = [
            {
                _id: new mongoose.Types.ObjectId(),
                title: "1-1",
                bar: 10101,
                sector: 0,
                createdAt: new Date("2024-01-01"),
                updatedAt: new Date("2024-01-02"),
            },
            {
                _id: new mongoose.Types.ObjectId(),
                title: "2-1",
                bar: 20201,
                sector: 1,
                createdAt: new Date("2024-02-01"),
                updatedAt: new Date("2024-02-02"),
            },
        ];
        const result = formatZonesForExcelUtil(zones);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            "Название зоны": "1-1",
            Штрихкод: 10101,
            Сектор: 0,
            "Дата создания": "01.01.2024",
            "Дата обновления": "02.01.2024",
        });
        expect(result[1]).toEqual({
            "Название зоны": "2-1",
            Штрихкод: 20201,
            Сектор: 1,
            "Дата создания": "01.02.2024",
            "Дата обновления": "02.02.2024",
        });
    });
    it("возвращает пустой массив для пустого массива зон", () => {
        const result = formatZonesForExcelUtil([]);
        expect(result).toHaveLength(0);
    });
});
