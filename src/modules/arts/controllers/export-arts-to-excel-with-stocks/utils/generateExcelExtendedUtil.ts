import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../../../lib/excel/worksheetStyles.js";
import type { ExcelArtRowExtended } from "./types.js";

const SHEET_NAME = "Артикулы";
const COLUMN_KEYS: (keyof ExcelArtRowExtended)[] = [
  "Артикул",
  "Факт",
  "Вітрина",
  "Склад",
  "Сайт",
  "Назва (укр)",
  "Зона",
  "Ліміт",
  "Маркер",
  "Дата зрізу",
];
const COLUMN_WIDTHS = [12, 15, 15, 15, 15, 45, 10, 10, 15, 18];

/**
 * Генерирует Excel файл из расширенных данных артикулов
 * @param excelData - массив отформатированных данных для Excel с колонками Запасы и Витрина
 * @returns объект с буфером файла и именем файла
 */
export async function generateExcelExtendedUtil(
  excelData: ExcelArtRowExtended[]
): Promise<{ buffer: Buffer; fileName: string }> {
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
  const fileName = `arts_export_with_stocks_${
    new Date().toISOString().split("T")[0]
  }.xlsx`;

  return { buffer: Buffer.from(buffer), fileName };
}
