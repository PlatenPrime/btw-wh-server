import ExcelJS from "exceljs";
import { applyHeaderStyle } from "../../../../lib/excel/worksheetStyles.js";
import { computeSharePercent } from "../../../sku-reporting/utils/computeSharePercent.js";
import type { SkugrSkuSalesRow } from "../../../sku-sales-reports/controllers/get-skugr-skus-sales/utils/getSkugrSkusSalesUtil.js";
import {
  SKU_EXCEL_PHOTO_COLUMN_WIDTH,
  SKU_EXCEL_PHOTO_HEADER,
  embedSkuPreviewInCell,
  previewRowHeightPt,
  type SkuPreviewJpeg,
} from "../../../../lib/excel/skuExcelPhoto.js";

export const SKU_SKUGR_SKUS_SHARE_SHEET_NAME = "Дані";

export const SKU_SKUGR_SKUS_SHARE_DATA_HEADERS = [
  "Товар",
  "Продажі, шт",
  "Виручка, грн",
  "Частка за продажами, %",
  "Частка за виручкою, %",
] as const;

/** @deprecated use SKU_SKUGR_SKUS_SHARE_DATA_HEADERS + optional photo */
export const SKU_SKUGR_SKUS_SHARE_HEADERS = [
  SKU_EXCEL_PHOTO_HEADER,
  ...SKU_SKUGR_SKUS_SHARE_DATA_HEADERS,
] as const;

export { previewRowHeightPt, SKU_EXCEL_PHOTO_COLUMN_WIDTH as SKU_SHARE_PHOTO_COLUMN_WIDTH };

const SHARE_NUM_FMT = "0.00";

/** 100 при ненулевом итоге метрики, иначе 0. */
export function totalSharePercent(total: number): number {
  return total === 0 ? 0 : 100;
}

export function skuSkugrSkusShareFileName(
  skugrId: string,
  dateFrom: string,
  dateTo: string,
): string {
  return `sku_skugr_skus_share_${skugrId}_${dateFrom}_${dateTo}.xlsx`;
}

export type SkugrSkusShareTotal = {
  title: string;
  salesPcs: number;
  salesUah: number;
};

function writeShareCells(
  row: ExcelJS.Row,
  titleCol: number,
  salesPcs: number,
  salesUah: number,
  all: SkugrSkusShareTotal,
): void {
  row.getCell(titleCol + 3).value = computeSharePercent(salesPcs, all.salesPcs);
  row.getCell(titleCol + 4).value = computeSharePercent(salesUah, all.salesUah);
  row.getCell(titleCol + 3).numFmt = SHARE_NUM_FMT;
  row.getCell(titleCol + 4).numFmt = SHARE_NUM_FMT;
}

export async function buildSkuSkugrSkusShareExcel(input: {
  skugrId: string;
  dateFrom: string;
  dateTo: string;
  rows: readonly SkugrSkuSalesRow[];
  all: SkugrSkusShareTotal;
  previews: ReadonlyMap<string, SkuPreviewJpeg>;
  includeImages?: boolean;
}): Promise<{ buffer: Buffer; fileName: string }> {
  const includeImages = input.includeImages === true;
  const photoOffset = includeImages ? 1 : 0;
  const titleCol = 1 + photoOffset;
  const headers = includeImages
    ? ([SKU_EXCEL_PHOTO_HEADER, ...SKU_SKUGR_SKUS_SHARE_DATA_HEADERS] as const)
    : SKU_SKUGR_SKUS_SHARE_DATA_HEADERS;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SKU_SKUGR_SKUS_SHARE_SHEET_NAME);

  const header = sheet.getRow(1);
  headers.forEach((title, index) => {
    header.getCell(index + 1).value = title;
  });
  applyHeaderStyle(sheet, headers.length);

  if (includeImages) {
    sheet.getColumn(1).width = SKU_EXCEL_PHOTO_COLUMN_WIDTH;
  }
  sheet.getColumn(titleCol).width = 40;
  sheet.getColumn(titleCol + 1).width = 16;
  sheet.getColumn(titleCol + 2).width = 16;
  sheet.getColumn(titleCol + 3).width = 26;
  sheet.getColumn(titleCol + 4).width = 26;

  const totalRow = sheet.getRow(2);
  totalRow.getCell(titleCol).value = input.all.title;
  totalRow.getCell(titleCol + 1).value = input.all.salesPcs;
  totalRow.getCell(titleCol + 2).value = input.all.salesUah;
  totalRow.getCell(titleCol + 3).value = totalSharePercent(input.all.salesPcs);
  totalRow.getCell(titleCol + 4).value = totalSharePercent(input.all.salesUah);
  totalRow.getCell(titleCol + 3).numFmt = SHARE_NUM_FMT;
  totalRow.getCell(titleCol + 4).numFmt = SHARE_NUM_FMT;
  totalRow.font = { bold: true };

  input.rows.forEach((sku, index) => {
    const rowNumber = 3 + index;
    const excelRow = sheet.getRow(rowNumber);
    excelRow.getCell(titleCol).value = sku.title;
    excelRow.getCell(titleCol + 1).value = sku.salesPcs;
    excelRow.getCell(titleCol + 2).value = sku.salesUah;
    writeShareCells(excelRow, titleCol, sku.salesPcs, sku.salesUah, input.all);

    if (!includeImages) return;
    const preview = input.previews.get(sku.skuId);
    if (!preview) return;
    embedSkuPreviewInCell({
      workbook,
      sheet,
      rowNumber,
      colIndex: 0,
      preview,
    });
  });

  const raw = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  return {
    buffer,
    fileName: skuSkugrSkusShareFileName(input.skugrId, input.dateFrom, input.dateTo),
  };
}
