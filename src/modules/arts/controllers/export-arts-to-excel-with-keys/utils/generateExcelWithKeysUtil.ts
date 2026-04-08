import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../../../lib/excel/worksheetStyles.js";
import { ExcelArtKeyRow } from "./types.js";

const SHEET_NAME = "ArtsKeys";
const COLUMN_KEYS: (keyof ExcelArtKeyRow)[] = [
  "artikul",
  "prodName",
  "nameukr",
  "namerus",
  "zone",
  "limit",
  "marker",
  "abc",
];
const COLUMN_WIDTHS = [18, 24, 30, 30, 12, 10, 14, 10];

/**
 * Генерирует key-based Excel файл из данных артикулов.
 */
export async function generateExcelWithKeysUtil(
  excelData: ExcelArtKeyRow[]
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
    const rowIndex = idx + 2;
    const worksheetRow = worksheet.getRow(rowIndex);

    COLUMN_KEYS.forEach((key, i) => {
      worksheetRow.getCell(i + 1).value = row[key];
    });

    applyDataRowStyle(worksheet, rowIndex, columnCount);
  });

  COLUMN_WIDTHS.forEach((width, i) => {
    worksheet.getColumn(i + 1).width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `arts_export_keys_${new Date().toISOString().split("T")[0]}.xlsx`;

  return { buffer: Buffer.from(buffer), fileName };
}

