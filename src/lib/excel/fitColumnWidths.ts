import type { Worksheet } from "exceljs";

export const FIT_COLUMN_MIN_WIDTH = 10;
export const FIT_COLUMN_MAX_WIDTH = 50;
export const FIT_COLUMN_PADDING = 2;

export type FitColumnWidthsOptions = {
  columnCount: number;
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
};

/** Visible text length used to size a column. */
export function excelCellTextLength(value: unknown): number {
  if (value == null) {
    return 0;
  }
  if (typeof value === "string") {
    return value.length;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).length;
  }
  if (value instanceof Date) {
    return value.toISOString().length;
  }
  return String(value).length;
}

/**
 * Sets each column width from the longest cell text (+ padding), clamped to min/max.
 * ExcelJS has no AutoFit; this approximates content-sized columns.
 */
export function fitColumnWidths(
  worksheet: Worksheet,
  {
    columnCount,
    minWidth = FIT_COLUMN_MIN_WIDTH,
    maxWidth = FIT_COLUMN_MAX_WIDTH,
    padding = FIT_COLUMN_PADDING,
  }: FitColumnWidthsOptions
): void {
  for (let c = 1; c <= columnCount; c++) {
    const column = worksheet.getColumn(c);
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, excelCellTextLength(cell.value));
    });
    column.width = Math.min(Math.max(maxLength + padding, minWidth), maxWidth);
  }
}
