import type ExcelJS from "exceljs";

/** Keep in sync with SKU_PREVIEW_MAX_EDGE_PX in loadSkuPreviewJpegs.ts */
export const SKU_EXCEL_PHOTO_MAX_PX = 100;
export const SKU_EXCEL_PHOTO_HEADER = "Фото";

const DEFAULT_ROW_HEIGHT_PT = 15;

/** Excel column width (character units) for ~SKU_EXCEL_PHOTO_MAX_PX CSS px. */
export const SKU_EXCEL_PHOTO_COLUMN_WIDTH = (SKU_EXCEL_PHOTO_MAX_PX - 5) / 7;

export type SkuPreviewJpeg = {
  buffer: Buffer;
  width: number;
  height: number;
};

export function previewRowHeightPt(heightPx: number): number {
  return Math.max(DEFAULT_ROW_HEIGHT_PT, (heightPx * 72) / 96);
}

export function embedSkuPreviewInCell(input: {
  workbook: ExcelJS.Workbook;
  sheet: ExcelJS.Worksheet;
  rowNumber: number;
  /** 0-based ExcelJS column index for image top-left. */
  colIndex: number;
  preview: SkuPreviewJpeg;
}): void {
  const row = input.sheet.getRow(input.rowNumber);
  row.height = previewRowHeightPt(input.preview.height);
  const imageId = input.workbook.addImage({
    base64: input.preview.buffer.toString("base64"),
    extension: "jpeg",
  });
  input.sheet.addImage(imageId, {
    tl: { col: input.colIndex, row: input.rowNumber - 1 },
    ext: { width: input.preview.width, height: input.preview.height },
    editAs: "oneCell",
  });
}
