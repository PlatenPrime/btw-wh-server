import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { generateExcelExtendedUtil } from "../generateExcelExtendedUtil.js";
describe("generateExcelExtendedUtil", () => {
    it("генерирует Excel файл с корректной структурой", () => {
        const excelData = [
            {
                Артикул: "ART-001",
                Факт: "",
                Вітрина: 30,
                Сайт: 50,
                Склад: 20,
                "Назва (укр)": "Тестовий артикул",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                "Дата зрізу": "15.01.2024",
            },
            {
                Артикул: "ART-002",
                Факт: "",
                Вітрина: 40,
                Сайт: 50,
                Склад: 10,
                "Назва (укр)": "Інший артикул",
                Зона: "B2",
                Ліміт: 200,
                Маркер: "MARK2",
                "Дата зрізу": "20.01.2024",
            },
        ];
        const result = generateExcelExtendedUtil(excelData);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^arts_export_with_stocks_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
    it("генерирует корректное имя файла с текущей датой", () => {
        const excelData = [
            {
                Артикул: "ART-001",
                Факт: "",
                Вітрина: 30,
                Сайт: 50,
                Склад: 20,
                "Назва (укр)": "Тест",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                "Дата зрізу": "15.01.2024",
            },
        ];
        const today = new Date().toISOString().split("T")[0];
        const result = generateExcelExtendedUtil(excelData);
        expect(result.fileName).toBe(`arts_export_with_stocks_${today}.xlsx`);
    });
    it("обрабатывает пустой массив данных", () => {
        const result = generateExcelExtendedUtil([]);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^arts_export_with_stocks_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
    it("проверяет структуру Excel файла - можно прочитать буфер", () => {
        const excelData = [
            {
                Артикул: "ART-001",
                Факт: "",
                Вітрина: 30,
                Сайт: 50,
                Склад: 20,
                "Назва (укр)": "Тест",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                "Дата зрізу": "15.01.2024",
            },
        ];
        const result = generateExcelExtendedUtil(excelData);
        // Проверяем что буфер можно прочитать как Excel файл
        const workbook = XLSX.read(result.buffer, { type: "buffer" });
        expect(workbook.SheetNames).toContain("Артикулы");
        const worksheet = workbook.Sheets["Артикулы"];
        expect(worksheet).toBeDefined();
        // Проверяем что данные присутствуют
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        expect(jsonData).toHaveLength(1);
        expect(jsonData[0]["Артикул"]).toBe("ART-001");
    });
    it("генерирует файл с корректной структурой листа", () => {
        const excelData = [
            {
                Артикул: "ART-001",
                Факт: "",
                Вітрина: 30,
                Сайт: 50,
                Склад: 20,
                "Назва (укр)": "Тест",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                "Дата зрізу": "15.01.2024",
            },
        ];
        const result = generateExcelExtendedUtil(excelData);
        const workbook = XLSX.read(result.buffer, { type: "buffer" });
        const worksheet = workbook.Sheets["Артикулы"];
        // Проверяем что лист создан и содержит данные
        expect(worksheet).toBeDefined();
        expect(worksheet["!ref"]).toBeDefined(); // Диапазон данных
        // Проверяем что данные присутствуют
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        expect(jsonData).toHaveLength(1);
        // Примечание: настройки !cols не сохраняются при чтении буфера через XLSX.read(),
        // но они устанавливаются в исходном worksheet перед записью в буфер
    });
    it("обрабатывает данные с разными типами значений", () => {
        const excelData = [
            {
                Артикул: "ART-001",
                Факт: "",
                Вітрина: 0,
                Сайт: "", // пустая строка
                Склад: 0,
                "Назва (укр)": "Тест",
                Зона: "A1",
                Ліміт: 0, // число 0
                Маркер: "",
                "Дата зрізу": "",
            },
            {
                Артикул: "ART-002",
                Факт: "",
                Вітрина: -50, // отрицательное число
                Сайт: 50,
                Склад: 100, // число
                "Назва (укр)": "",
                Зона: "B2",
                Ліміт: "", // строка
                Маркер: "MARK",
                "Дата зрізу": "20.01.2024",
            },
        ];
        const result = generateExcelExtendedUtil(excelData);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        // Проверяем что файл можно прочитать
        const workbook = XLSX.read(result.buffer, { type: "buffer" });
        const worksheet = workbook.Sheets["Артикулы"];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        expect(jsonData).toHaveLength(2);
    });
});
