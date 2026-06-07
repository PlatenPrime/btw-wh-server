import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { generateExcelWithKeysUtil } from "../generateExcelWithKeysUtil.js";
async function readSheetToJson(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("ArtsKeys");
    if (!worksheet)
        return [];
    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const value = cell.value;
        headers[colNumber - 1] = typeof value === "string" ? value : String(value ?? "");
    });
    const rows = [];
    const rowCount = worksheet.rowCount ?? 0;
    for (let rowIndex = 2; rowIndex <= rowCount; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row.getCell(index + 1).value ?? "";
        });
        rows.push(obj);
    }
    return rows;
}
describe("generateExcelWithKeysUtil", () => {
    it("генерирует Excel файл с key-based колонками", async () => {
        const excelData = [
            {
                artikul: "ART-001",
                prodName: "Gemar",
                nameukr: "Тест",
                namerus: "Тест",
                zone: "A1",
                limit: 100,
                marker: "MARK",
                abc: "A",
            },
        ];
        const result = await generateExcelWithKeysUtil(excelData);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^arts_export_keys_\d{4}-\d{2}-\d{2}\.xlsx$/);
        const jsonData = await readSheetToJson(result.buffer);
        expect(jsonData).toHaveLength(1);
        expect(jsonData[0]?.artikul).toBe("ART-001");
        expect(jsonData[0]?.prodName).toBe("Gemar");
    });
    it("обрабатывает пустой массив данных", async () => {
        const result = await generateExcelWithKeysUtil([]);
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.fileName).toMatch(/^arts_export_keys_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
});
