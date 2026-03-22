import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../lib/excel/worksheetStyles.js";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "../../analog-slices/controllers/common/salesComparisonUtils.js";
import type { ISkuSliceDataItem } from "../models/SkuSlice.js";

const HEADER_LABELS = [
  "Ідентифікатор товару",
  "Назва",
  "Конкурент",
  "Виробник",
  "Посилання",
] as const;

const METRIC_LABELS = ["Залишок", "Ціна", "Виручка"] as const;

const ROWS_PER_SKU_BLOCK = 3;

export function formatDateHeader(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function enumerateSliceDates(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    out.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function safeFilePart(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export type SkuSliceExcelSkuRow = {
  title: string;
  url: string;
  productId: string;
  konkName: string;
  prodName: string;
};

export type SkuSliceExcelTitles = {
  competitorTitle: string;
  producerName: string;
};

function getFirstAndLastNumeric(
  values: (number | null | undefined)[]
): { first: number; last: number } | null {
  let first: number | null = null;
  let last: number | null = null;

  for (let i = 0; i < values.length && first === null; i++) {
    const raw = values[i];
    const val = typeof raw === "number" ? raw : Number(raw ?? NaN);
    if (Number.isFinite(val)) first = val;
  }

  for (let i = values.length - 1; i >= 0 && last === null; i--) {
    const raw = values[i];
    const val = typeof raw === "number" ? raw : Number(raw ?? NaN);
    if (Number.isFinite(val)) last = val;
  }

  if (first === null || last === null) return null;
  return { first, last };
}

function applyRowDiffAndPct(
  row: ExcelJS.Row,
  dateValues: (number | null)[],
  dataStartCol: number,
  diffCol: number,
  diffPctCol: number
): void {
  const bounds = getFirstAndLastNumeric(dateValues);
  if (!bounds) return;

  const diff = bounds.last - bounds.first;
  row.getCell(diffCol).value = diff;

  const diffPctCell = row.getCell(diffPctCol);
  if (bounds.first === 0) {
    diffPctCell.value = null;
    diffPctCell.fill = {
      ...(diffPctCell.fill ?? {}),
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC0CB" },
    };
    return;
  }

  const rawPct = (diff / bounds.first) * 100;
  diffPctCell.value = Math.round(rawPct * 100) / 100;
}

function highlightStockIncreases(
  stockRow: ExcelJS.Row,
  dataStartCol: number,
  dateCount: number
): void {
  for (let i = 1; i < dateCount; i++) {
    const prevCell = stockRow.getCell(dataStartCol + i - 1);
    const currCell = stockRow.getCell(dataStartCol + i);
    const prevVal =
      typeof prevCell.value === "number"
        ? prevCell.value
        : Number(prevCell.value ?? NaN);
    const currVal =
      typeof currCell.value === "number"
        ? currCell.value
        : Number(currCell.value ?? NaN);
    if (!Number.isFinite(prevVal) || !Number.isFinite(currVal)) continue;
    if (currVal > prevVal) {
      currCell.font = {
        ...(currCell.font ?? {}),
        color: { argb: "FFFF0000" },
      };
    }
  }
}

function highlightPriceDecreases(
  priceRow: ExcelJS.Row,
  dataStartCol: number,
  dateCount: number
): void {
  for (let i = 1; i < dateCount; i++) {
    const prevCell = priceRow.getCell(dataStartCol + i - 1);
    const currCell = priceRow.getCell(dataStartCol + i);
    const prevVal =
      typeof prevCell.value === "number"
        ? prevCell.value
        : Number(prevCell.value ?? NaN);
    const currVal =
      typeof currCell.value === "number"
        ? currCell.value
        : Number(currCell.value ?? NaN);
    if (!Number.isFinite(prevVal) || !Number.isFinite(currVal)) continue;
    if (currVal < prevVal) {
      currCell.font = {
        ...(currCell.font ?? {}),
        color: { argb: "FF00AA00" },
      };
    }
  }
}

function computePeriodSalesTotals(
  stocks: (number | null)[],
  prices: (number | null)[]
): { totalSales: number; totalRevenue: number } {
  const salesResults = computeSalesFromStockSequence(stocks);
  let totalSales = 0;
  let totalRevenue = 0;
  for (let i = 0; i < salesResults.length; i++) {
    const day = salesResults[i]!;
    const p = prices[i];
    const price = typeof p === "number" && Number.isFinite(p) ? p : null;
    totalSales += day.sales;
    totalRevenue += computeRevenueForDay(day.sales, price);
  }
  return { totalSales, totalRevenue };
}

function setMergedMetaAlignment(cell: ExcelJS.Cell): void {
  const prev = cell.alignment ?? {};
  cell.alignment = {
    ...prev,
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
}

/**
 * Excel: блоки по SKU (Залишок / Ціна / Виручка), колонка F — підписи метрик,
 * дати з G, потім «Різниця» та «Різниця, %»; внизу — статистика продажів.
 */
export async function buildSkuSliceExcelForSkus(
  skus: SkuSliceExcelSkuRow[],
  dateFrom: Date,
  dateTo: Date,
  getItem: (
    konkName: string,
    productId: string,
    sliceDate: Date
  ) => ISkuSliceDataItem | null | undefined,
  titles: SkuSliceExcelTitles
): Promise<{ buffer: Buffer; fileName: string }> {
  const dates = enumerateSliceDates(dateFrom, dateTo);
  const dateCount = dates.length;
  const dataStartCol = 7;
  const diffCol = dataStartCol + dateCount;
  const diffPctCol = diffCol + 1;
  const columnCount = diffPctCol;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Срез");

  const headerRow = sheet.getRow(1);
  for (let i = 0; i < HEADER_LABELS.length; i++) {
    headerRow.getCell(i + 1).value = HEADER_LABELS[i];
  }
  headerRow.getCell(6).value = "";

  dates.forEach((d, index) => {
    headerRow.getCell(dataStartCol + index).value = formatDateHeader(d);
  });
  headerRow.getCell(diffCol).value = "Різниця";
  headerRow.getCell(diffPctCol).value = "Різниця, %";

  applyHeaderStyle(sheet, columnCount);

  const salesSummaryRows: {
    productId: string;
    totalSales: number;
    totalRevenue: number;
  }[] = [];

  let startRow = 2;
  for (let s = 0; s < skus.length; s++) {
    const sku = skus[s]!;
    const stocks: (number | null)[] = [];
    const prices: (number | null)[] = [];

    for (const d of dates) {
      const item = getItem(sku.konkName, sku.productId, d);
      if (item != null) {
        stocks.push(item.stock);
        prices.push(item.price);
      } else {
        stocks.push(null);
        prices.push(null);
      }
    }

    const salesByDay = computeSalesFromStockSequence(stocks);
    const revenues: (number | null)[] = salesByDay.map((day, i) => {
      if (stocks[i] === null) return null;
      const p = prices[i];
      const price = typeof p === "number" && Number.isFinite(p) ? p : null;
      return computeRevenueForDay(day.sales, price);
    });

    const stockRow = sheet.getRow(startRow);
    const priceRow = sheet.getRow(startRow + 1);
    const revenueRow = sheet.getRow(startRow + 2);

    stockRow.getCell(1).value = sku.productId;
    stockRow.getCell(2).value = sku.title;
    stockRow.getCell(3).value = titles.competitorTitle;
    stockRow.getCell(4).value = titles.producerName;
    stockRow.getCell(5).value = sku.url;

    stockRow.getCell(6).value = METRIC_LABELS[0];
    priceRow.getCell(6).value = METRIC_LABELS[1];
    revenueRow.getCell(6).value = METRIC_LABELS[2];

    for (let i = 0; i < dateCount; i++) {
      const col = dataStartCol + i;
      const st = stocks[i];
      const pr = prices[i];
      stockRow.getCell(col).value = st ?? null;
      priceRow.getCell(col).value = pr ?? null;
      revenueRow.getCell(col).value = revenues[i] ?? null;
    }

    sheet.mergeCells(startRow, 1, startRow + 2, 1);
    sheet.mergeCells(startRow, 2, startRow + 2, 2);
    sheet.mergeCells(startRow, 3, startRow + 2, 3);
    sheet.mergeCells(startRow, 4, startRow + 2, 4);
    sheet.mergeCells(startRow, 5, startRow + 2, 5);

    for (const c of [1, 2, 3, 4, 5] as const) {
      setMergedMetaAlignment(stockRow.getCell(c));
    }

    applyRowDiffAndPct(stockRow, stocks, dataStartCol, diffCol, diffPctCol);
    applyRowDiffAndPct(priceRow, prices, dataStartCol, diffCol, diffPctCol);
    applyRowDiffAndPct(revenueRow, revenues, dataStartCol, diffCol, diffPctCol);

    highlightStockIncreases(stockRow, dataStartCol, dateCount);
    highlightPriceDecreases(priceRow, dataStartCol, dateCount);

    for (let r = startRow; r <= startRow + 2; r++) {
      applyDataRowStyle(sheet, r, columnCount);
    }

    const totals = computePeriodSalesTotals(stocks, prices);
    salesSummaryRows.push({
      productId: sku.productId,
      totalSales: totals.totalSales,
      totalRevenue: totals.totalRevenue,
    });

    startRow += ROWS_PER_SKU_BLOCK;
  }

  startRow += 1;
  const summaryTitleRow = sheet.getRow(startRow);
  summaryTitleRow.getCell(1).value = "Статистика продажів";
  summaryTitleRow.getCell(1).font = {
    ...(summaryTitleRow.getCell(1).font ?? {}),
    bold: true,
  };
  startRow += 1;

  const sumHeader = sheet.getRow(startRow);
  sumHeader.getCell(1).value = "Ідентифікатор товару";
  sumHeader.getCell(2).value = "Продано, шт";
  sumHeader.getCell(3).value = "Виручка";
  sumHeader.font = { bold: true };
  applyDataRowStyle(sheet, startRow, 3);
  startRow += 1;

  let grandSales = 0;
  let grandRevenue = 0;
  for (const line of salesSummaryRows) {
    const row = sheet.getRow(startRow);
    row.getCell(1).value = line.productId;
    row.getCell(2).value = line.totalSales;
    row.getCell(3).value = line.totalRevenue;
    applyDataRowStyle(sheet, startRow, 3);
    grandSales += line.totalSales;
    grandRevenue += line.totalRevenue;
    startRow += 1;
  }

  const totalRow = sheet.getRow(startRow);
  totalRow.getCell(1).value = "Разом";
  totalRow.getCell(2).value = grandSales;
  totalRow.getCell(3).value = grandRevenue;
  totalRow.font = { bold: true };
  applyDataRowStyle(sheet, startRow, 3);

  for (let c = 1; c <= columnCount; c++) {
    sheet.getColumn(c).width = 14;
  }

  const buf = await workbook.xlsx.writeBuffer();
  const fromS = formatDateHeader(dateFrom);
  const toS = formatDateHeader(dateTo);
  const nameBase =
    skus.length === 1
      ? `sku_slice_${safeFilePart(skus[0]!.productId)}_${fromS}_${toS}`
      : `sku_slice_konk_${fromS}_${toS}`;
  return {
    buffer: Buffer.from(buf),
    fileName: `${nameBase}.xlsx`,
  };
}
