import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { generateExcelUtil } from "../generateExcelUtil.js";
async function readSheetToJson(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Остатки");
    if (!worksheet)
        return [];
    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const value = cell.value;
        headers[colNumber - 1] =
            typeof value === "string" ? value : String(value ?? "");
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
describe("generateExcelUtil", () => {
    it("generates Excel buffer with poses stock columns", async () => {
        const excelData = [
            {
                Артикул: "ART-001",
                "Название (укр)": "Товар",
                Склад: "Мережі",
                Количество: 10,
            },
        ];
        const result = await generateExcelUtil(excelData, "merezhi");
        expect(Buffer.isBuffer(result.buffer)).toBe(true);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toMatch(/^poses_stocks_merezhi_\d{4}-\d{2}-\d{2}\.xlsx$/);
        const rows = await readSheetToJson(result.buffer);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            Артикул: "ART-001",
            "Название (укр)": "Товар",
            Склад: "Мережі",
            Количество: 10,
        });
    });
    it("uses all in file name when sklad is not provided", async () => {
        const result = await generateExcelUtil([], undefined);
        expect(result.fileName).toMatch(/^poses_stocks_all_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
});
