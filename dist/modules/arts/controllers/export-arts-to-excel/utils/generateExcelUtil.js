import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../../../lib/excel/worksheetStyles.js";
const SHEET_NAME = "Артикулы";
const COLUMN_KEYS = [
    "Артикул",
    "Назва (укр)",
    "Назва (рус)",
    "Зона",
    "Ліміт",
    "Маркер",
    "Залишки на сайті",
    "Дата оновлення залишків",
];
const COLUMN_WIDTHS = [15, 30, 30, 10, 10, 15, 15, 18];
/**
 * Генерирует Excel файл из данных артикулов
 * @param excelData - массив отформатированных данных для Excel
 * @returns объект с буфером файла и именем файла
 */
export async function generateExcelUtil(excelData) {
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
    const fileName = `arts_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    return { buffer: Buffer.from(buffer), fileName };
}
