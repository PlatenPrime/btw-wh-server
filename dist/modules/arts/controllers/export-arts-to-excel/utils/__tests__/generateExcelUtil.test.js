import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { generateExcelUtil } from "../generateExcelUtil.js";
/** Reads worksheet into array of row objects (header row = keys, following rows = values). */
async function readSheetToJson(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Артикулы");
    if (!worksheet)
        return [];
    const rows = [];
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const v = cell.value;
        headers[colNumber - 1] = typeof v === "string" ? v : String(v ?? "");
    });
    const rowCount = worksheet.rowCount ?? 0;
    for (let r = 2; r <= rowCount; r++) {
        const row = worksheet.getRow(r);
        const obj = {};
        headers.forEach((h, i) => {
            const cell = row.getCell(i + 1);
            obj[h] = cell.value ?? "";
        });
        rows.push(obj);
    }
    return rows;
}
describe("generateExcelUtil", () => {
    it("генерирует Excel файл с корректной структурой", async () => {
        const excelData = [
            {
                Артикул: "ART-001",
                "Назва (укр)": "Тестовий артикул",
                "Назва (рус)": "Тестовый артикул",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                ABC: "",
                "Залишки на сайті": 50,
                "Дата оновлення залишків": "15.01.2024",
            },
            {
                Артикул: "ART-002",
                "Назва (укр)": "Інший артикул",
                "Назва (рус)": "Другой артикул",
                Зона: "B2",
                Ліміт: 200,
                Маркер: "MARK2",
                ABC: "",
                "Залишки на сайті": 75,
                "Дата оновлення залишків": "20.01.2024",
            },
        ];
        const result = await generateExcelUtil(excelData);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^arts_export_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
    it("генерирует корректное имя файла с текущей датой", async () => {
        const excelData = [
            {
                Артикул: "ART-001",
                "Назва (укр)": "Тест",
                "Назва (рус)": "Тест",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                ABC: "",
                "Залишки на сайті": 50,
                "Дата оновлення залишків": "15.01.2024",
            },
        ];
        const today = new Date().toISOString().split("T")[0];
        const result = await generateExcelUtil(excelData);
        expect(result.fileName).toBe(`arts_export_${today}.xlsx`);
    });
    it("обрабатывает пустой массив данных", async () => {
        const result = await generateExcelUtil([]);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^arts_export_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
    it("проверяет структуру Excel файла - можно прочитать буфер", async () => {
        const excelData = [
            {
                Артикул: "ART-001",
                "Назва (укр)": "Тест",
                "Назва (рус)": "Тест",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                ABC: "",
                "Залишки на сайті": 50,
                "Дата оновлення залишків": "15.01.2024",
            },
        ];
        const result = await generateExcelUtil(excelData);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(result.buffer);
        expect(workbook.worksheets.map((ws) => ws.name)).toContain("Артикулы");
        const worksheet = workbook.getWorksheet("Артикулы");
        expect(worksheet).toBeDefined();
        const jsonData = await readSheetToJson(result.buffer);
        expect(jsonData).toHaveLength(1);
        expect(jsonData[0]["Артикул"]).toBe("ART-001");
    });
    it("генерирует файл с корректной структурой листа", async () => {
        const excelData = [
            {
                Артикул: "ART-001",
                "Назва (укр)": "Тест",
                "Назва (рус)": "Тест",
                Зона: "A1",
                Ліміт: 100,
                Маркер: "MARK",
                ABC: "",
                "Залишки на сайті": 50,
                "Дата оновлення залишків": "15.01.2024",
            },
        ];
        const result = await generateExcelUtil(excelData);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(result.buffer);
        const worksheet = workbook.getWorksheet("Артикулы");
        expect(worksheet).toBeDefined();
        expect(worksheet.rowCount).toBeGreaterThanOrEqual(1);
        const jsonData = await readSheetToJson(result.buffer);
        expect(jsonData).toHaveLength(1);
    });
    it("обрабатывает данные с разными типами значений", async () => {
        const excelData = [
            {
                Артикул: "ART-001",
                "Назва (укр)": "Тест",
                "Назва (рус)": "Тест",
                Зона: "A1",
                Ліміт: 0,
                Маркер: "",
                ABC: "",
                "Залишки на сайті": "",
                "Дата оновлення залишків": "",
            },
            {
                Артикул: "ART-002",
                "Назва (укр)": "",
                "Назва (рус)": "",
                Зона: "B2",
                Ліміт: "",
                Маркер: "MARK",
                ABC: "",
                "Залишки на сайті": 100,
                "Дата оновлення залишків": "20.01.2024",
            },
        ];
        const result = await generateExcelUtil(excelData);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        const jsonData = await readSheetToJson(result.buffer);
        expect(jsonData).toHaveLength(2);
    });
});
