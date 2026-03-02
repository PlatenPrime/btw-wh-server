import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../../../lib/excel/worksheetStyles.js";
const SHEET_NAME = "Зони";
const COLUMN_KEYS = ["Назва", "Штрихкод", "Сектор"];
const COLUMN_WIDTHS = [15, 12, 10];
export async function generateExcelUtil(excelData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(SHEET_NAME);
    const columnCount = COLUMN_KEYS.length;
    // Header row
    const headerRow = worksheet.getRow(1);
    COLUMN_KEYS.forEach((key, i) => {
        headerRow.getCell(i + 1).value = key;
    });
    applyHeaderStyle(worksheet, columnCount);
    // Data rows
    excelData.forEach((row, idx) => {
        const r = worksheet.getRow(idx + 2);
        COLUMN_KEYS.forEach((key, i) => {
            r.getCell(i + 1).value = row[key];
        });
        applyDataRowStyle(worksheet, idx + 2, columnCount);
    });
    // Column widths
    COLUMN_WIDTHS.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `zones_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    return { buffer: Buffer.from(buffer), fileName };
}
