import ExcelJS from "exceljs";
import { applyHeaderStyle } from "../../../../lib/excel/worksheetStyles.js";
import { computeSharePercent } from "../../../sku-reporting/utils/computeSharePercent.js";
import type { SkugrSkuSalesRow } from "../../../sku-sales-reports/controllers/get-skugr-skus-sales/utils/getSkugrSkusSalesUtil.js";
import type { SkuPreviewJpeg } from "./loadSkuPreviewJpegs.js";

export const SKU_SKUGR_SKUS_SHARE_SHEET_NAME = "Дані";

export const SKU_SKUGR_SKUS_SHARE_HEADERS = [
  "Фото",
  "Товар",
  "Продажі, шт",
  "Виручка, грн",
  "Частка за продажами, %",
  "Частка за виручкою, %",
] as const;

const PHOTO_MAX_PX = 200;
const DEFAULT_ROW_HEIGHT_PT = 15;
const SHARE_NUM_FMT = "0.00";

/** Excel column width (character units) for ~200 CSS px. */
export const SKU_SHARE_PHOTO_COLUMN_WIDTH = (PHOTO_MAX_PX - 5) / 7;

export function previewRowHeightPt(heightPx: number): number {
  return Math.max(DEFAULT_ROW_HEIGHT_PT, (heightPx * 72) / 96);
}

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
  salesPcs: number,
  salesUah: number,
  all: SkugrSkusShareTotal,
): void {
  row.getCell(5).value = computeSharePercent(salesPcs, all.salesPcs);
  row.getCell(6).value = computeSharePercent(salesUah, all.salesUah);
  row.getCell(5).numFmt = SHARE_NUM_FMT;
  row.getCell(6).numFmt = SHARE_NUM_FMT;
}

export async function buildSkuSkugrSkusShareExcel(input: {
  skugrId: string;
  dateFrom: string;
  dateTo: string;
  rows: readonly SkugrSkuSalesRow[];
  all: SkugrSkusShareTotal;
  previews: ReadonlyMap<string, SkuPreviewJpeg>;
}): Promise<{ buffer: Buffer; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SKU_SKUGR_SKUS_SHARE_SHEET_NAME);

  const header = sheet.getRow(1);
  SKU_SKUGR_SKUS_SHARE_HEADERS.forEach((title, index) => {
    header.getCell(index + 1).value = title;
  });
  applyHeaderStyle(sheet, SKU_SKUGR_SKUS_SHARE_HEADERS.length);

  sheet.getColumn(1).width = SKU_SHARE_PHOTO_COLUMN_WIDTH;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 16;
  sheet.getColumn(4).width = 16;
  sheet.getColumn(5).width = 26;
  sheet.getColumn(6).width = 26;

  const totalRow = sheet.getRow(2);
  totalRow.getCell(2).value = input.all.title;
  totalRow.getCell(3).value = input.all.salesPcs;
  totalRow.getCell(4).value = input.all.salesUah;
  totalRow.getCell(5).value = totalSharePercent(input.all.salesPcs);
  totalRow.getCell(6).value = totalSharePercent(input.all.salesUah);
  totalRow.getCell(5).numFmt = SHARE_NUM_FMT;
  totalRow.getCell(6).numFmt = SHARE_NUM_FMT;
  totalRow.font = { bold: true };

  input.rows.forEach((sku, index) => {
    const rowNumber = 3 + index;
    const excelRow = sheet.getRow(rowNumber);
    excelRow.getCell(2).value = sku.title;
    excelRow.getCell(3).value = sku.salesPcs;
    excelRow.getCell(4).value = sku.salesUah;
    writeShareCells(excelRow, sku.salesPcs, sku.salesUah, input.all);

    const preview = input.previews.get(sku.skuId);
    if (!preview) return;
    excelRow.height = previewRowHeightPt(preview.height);
    const imageId = workbook.addImage({
      base64: preview.buffer.toString("base64"),
      extension: "jpeg",
    });
    sheet.addImage(imageId, {
      tl: { col: 0, row: rowNumber - 1 },
      ext: { width: preview.width, height: preview.height },
      editAs: "oneCell",
    });
  });

  const raw = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  return {
    buffer,
    fileName: skuSkugrSkusShareFileName(input.skugrId, input.dateFrom, input.dateTo),
  };
}
