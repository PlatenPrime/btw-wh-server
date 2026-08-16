import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  FIT_COLUMN_MAX_WIDTH,
  FIT_COLUMN_MIN_WIDTH,
  FIT_COLUMN_PADDING,
  excelCellTextLength,
  fitColumnWidths,
} from "../fitColumnWidths.js";

describe("excelCellTextLength", () => {
  it("returns 0 for nullish values", () => {
    expect(excelCellTextLength(null)).toBe(0);
    expect(excelCellTextLength(undefined)).toBe(0);
  });

  it("uses string length", () => {
    expect(excelCellTextLength("ab")).toBe(2);
  });

  it("stringifies booleans and numbers", () => {
    expect(excelCellTextLength(true)).toBe(4);
    expect(excelCellTextLength(12345)).toBe(5);
  });

  it("measures Date by ISO length", () => {
    const date = new Date("2026-08-16T10:00:00.000Z");
    expect(excelCellTextLength(date)).toBe(date.toISOString().length);
  });

  it("falls back to String() for other values", () => {
    expect(excelCellTextLength({ foo: 1 })).toBe(String({ foo: 1 }).length);
  });
});

describe("fitColumnWidths", () => {
  it("applies min width when column has no cells", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    fitColumnWidths(sheet, { columnCount: 1 });
    expect(sheet.getColumn(1).width).toBe(FIT_COLUMN_MIN_WIDTH);
  });

  it("treats null cells as zero length and still uses min width", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    sheet.getCell("A1").value = null;
    fitColumnWidths(sheet, { columnCount: 1 });
    expect(sheet.getColumn(1).width).toBe(FIT_COLUMN_MIN_WIDTH);
  });

  it("uses min width when content plus padding is shorter than min", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    sheet.getCell("A1").value = "ab";
    fitColumnWidths(sheet, { columnCount: 1 });
    expect(sheet.getColumn(1).width).toBe(FIT_COLUMN_MIN_WIDTH);
  });

  it("adds padding to the longest cell when between min and max", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    sheet.getCell("A1").value = "aa";
    sheet.getCell("A2").value = "x".repeat(20);
    fitColumnWidths(sheet, { columnCount: 1 });
    expect(sheet.getColumn(1).width).toBe(20 + FIT_COLUMN_PADDING);
  });

  it("caps at max width for long content", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    sheet.getCell("A1").value = "x".repeat(200);
    fitColumnWidths(sheet, { columnCount: 1 });
    expect(sheet.getColumn(1).width).toBe(FIT_COLUMN_MAX_WIDTH);
  });

  it("respects custom min, max and padding", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    sheet.getCell("A1").value = "hello";
    fitColumnWidths(sheet, {
      columnCount: 1,
      minWidth: 3,
      maxWidth: 8,
      padding: 1,
    });
    expect(sheet.getColumn(1).width).toBe(6);
  });

  it("fits each column independently", () => {
    const sheet = new ExcelJS.Workbook().addWorksheet("t");
    sheet.getCell("A1").value = "a";
    sheet.getCell("B1").value = "bbbbbbbbbbbb";
    fitColumnWidths(sheet, {
      columnCount: 2,
      minWidth: 4,
      maxWidth: 100,
      padding: 1,
    });
    expect(sheet.getColumn(1).width).toBe(4);
    expect(sheet.getColumn(2).width).toBe(13);
  });
});
