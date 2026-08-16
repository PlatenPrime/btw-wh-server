import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../lib/excel/worksheetStyles.js";
import { fitColumnWidths } from "../../../lib/excel/fitColumnWidths.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import {
  GRABO_SKU_EXCEL_COLUMNS,
  type GraboSkuExcelColumnKey,
} from "../constants/graboSkuExcelColumns.js";

export type GraboSkuExcelRow = {
  productId: string;
  title: string;
  url: string;
  isNewProduct: boolean;
  color: string;
  size: string;
  material: string;
  gas: string;
  language: string;
  gasCapacity: string;
  tags: string[];
  images: string[];
  isOnSite: boolean;
  lastSeenAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

function joinList(values: string[]): string {
  return values.join("; ");
}

function toIso(value: Date | undefined | null): string {
  return value instanceof Date ? value.toISOString() : "";
}

function excelCellValue(
  row: GraboSkuExcelRow,
  key: GraboSkuExcelColumnKey
): string | boolean {
  if (key === "tags" || key === "images") {
    return joinList(row[key]);
  }
  if (key === "lastSeenAt" || key === "createdAt" || key === "updatedAt") {
    return toIso(row[key]);
  }
  return row[key];
}

export async function buildGraboSkuExcelBuffer(
  rows: GraboSkuExcelRow[]
): Promise<{ buffer: Buffer; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("GraboSku");
  const columnCount = GRABO_SKU_EXCEL_COLUMNS.length;

  const headerRow = sheet.getRow(1);
  GRABO_SKU_EXCEL_COLUMNS.forEach((col, i) => {
    headerRow.getCell(i + 1).value = col.header;
  });
  applyHeaderStyle(sheet, columnCount);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const excelRow = sheet.getRow(r + 2);
    GRABO_SKU_EXCEL_COLUMNS.forEach((col, i) => {
      excelRow.getCell(i + 1).value = excelCellValue(row, col.key);
    });
    applyDataRowStyle(sheet, r + 2, columnCount);
  }

  fitColumnWidths(sheet, { columnCount });

  const buf = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(buf),
    fileName: `grabo-catalog-${toSliceDate(new Date()).toISOString().slice(0, 10)}.xlsx`,
  };
}
