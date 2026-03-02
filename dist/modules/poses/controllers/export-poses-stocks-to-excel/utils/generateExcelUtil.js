import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../../../lib/excel/worksheetStyles.js";
const SHEET_NAME = "Остатки";
const COLUMN_KEYS = [
    "Артикул",
    "Название (укр)",
    "Склад",
    "Количество",
];
const COLUMN_WIDTHS = [20, 40, 20, 15];
export async function generateExcelUtil(excelData, sklad) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(SHEET_NAME);
    const columnCount = COLUMN_KEYS.length;
    const headerRow = worksheet.getRow(1);
    COLUMN_KEYS.forEach((key, i) => {
        headerRow.getCell(i + 1).value = key;
    });
    applyHeaderStyle(worksheet, columnCount);
    excelData.forEach((row, idx) => {
        const r = worksheet.getRow(idx + 2);
        COLUMN_KEYS.forEach((key, i) => {
            r.getCell(i + 1).value = row[key];
        });
        applyDataRowStyle(worksheet, idx + 2, columnCount);
    });
    COLUMN_WIDTHS.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `poses_stocks_${(sklad ?? "all").toLowerCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;
    return { buffer: Buffer.from(buffer), fileName };
}
