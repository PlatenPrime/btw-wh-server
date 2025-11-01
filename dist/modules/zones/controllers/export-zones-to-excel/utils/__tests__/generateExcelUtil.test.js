import { describe, expect, it } from "vitest";
import { generateExcelUtil } from "../generateExcelUtil.js";
describe("generateExcelUtil", () => {
    it("генерирует Excel файл с корректной структурой", () => {
        const excelData = [
            {
                "Название зоны": "1-1",
                Штрихкод: 10101,
                Сектор: 0,
                "Дата создания": "01.01.2024",
                "Дата обновления": "02.01.2024",
            },
            {
                "Название зоны": "2-1",
                Штрихкод: 20201,
                Сектор: 1,
                "Дата создания": "01.02.2024",
                "Дата обновления": "02.02.2024",
            },
        ];
        const result = generateExcelUtil(excelData);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^zones_export_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
    it("генерирует корректное имя файла с текущей датой", () => {
        const excelData = [
            {
                "Название зоны": "1-1",
                Штрихкод: 10101,
                Сектор: 0,
                "Дата создания": "01.01.2024",
                "Дата обновления": "02.01.2024",
            },
        ];
        const today = new Date().toISOString().split("T")[0];
        const result = generateExcelUtil(excelData);
        expect(result.fileName).toBe(`zones_export_${today}.xlsx`);
    });
    it("обрабатывает пустой массив данных", () => {
        const result = generateExcelUtil([]);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.fileName).toMatch(/^zones_export_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
});
