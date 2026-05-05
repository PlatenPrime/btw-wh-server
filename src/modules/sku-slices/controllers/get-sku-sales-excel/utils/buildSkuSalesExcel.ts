import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../../../lib/excel/worksheetStyles.js";
import { formatExcelDateHeaderUk } from "../../../../../lib/excel/formatExcelDateHeaderUk.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import {
  applyRecountDayToSales,
  computeRevenueForDay,
  computeSalesFromStockSequence,
  toUtcDateKey,
} from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import {
  coalesceSkuSliceItemsAlongDates,
  sliceDateMinusDays,
} from "../../../utils/coalesceSkuSliceItemsForReporting.js";

const HEADER_LABELS = [
  "Ідентифікатор товару",
  "Назва",
  "Конкурент",
  "Виробник",
  "Товарна група",
  "Посилання",
] as const;

const METRIC_LABELS = ["Продажі", "Ціна", "Виручка"] as const;
const ROWS_PER_SKU_BLOCK = 3;
const META_COL_COUNT = HEADER_LABELS.length;
const METRIC_LABEL_COL = META_COL_COUNT + 1;
const RECOUNT_DAY_PURPLE_FILL_ARGB = "FF800080";

export type SkuSalesExcelSkuRow = {
  title: string;
  url: string;
  productId: string;
  konkName: string;
  competitorTitle: string;
  producerName: string;
  /** Заголовок Skugr для колонки «Товарна група»; пусто, если SKU не привязан. */
  skugrTitle?: string;
};

export type SkuSalesExcelOptions = {
  summaryMode?: "perSku" | "bottomOnly";
  summarySalesLabel?: string;
  summaryRevenueLabel?: string;
  recountDays?: string[];
};

export type SkuSalesPeriodMetrics = {
  salesByDay: number[];
  revenueByDay: number[];
  prices: (number | null)[];
  isRecountDayByDay: boolean[];
  totalSales: number;
  totalRevenue: number;
};

/**
 * Продажі/виручка по днях і підсумки за період — та сама логіка, що в Excel-рядку SKU.
 */
export function computeSkuSalesPeriodMetrics(
  sku: SkuSalesExcelSkuRow,
  dateFrom: Date,
  dateTo: Date,
  getItem: (
    konkName: string,
    productId: string,
    sliceDate: Date
  ) => ISkuSliceDataItem | null | undefined,
  recountDays: ReadonlySet<string> = new Set(),
): SkuSalesPeriodMetrics {
  const datesReport = enumerateSliceDates(dateFrom, dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);
  const datesFull =
    warmStart.getTime() < dateFrom.getTime()
      ? [warmStart, ...datesReport]
      : datesReport;
  const reportOffset = datesFull.length - datesReport.length;
  const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) =>
    getItem(sku.konkName, sku.productId, d),
  );
  const forReport = coalesced.slice(reportOffset);
  const stocksFull = coalesced.map((c) => c.stock);
  const prices = forReport.map((c) => c.price);
  const isRecountDayByDay = datesReport.map((date) =>
    recountDays.has(toUtcDateKey(date)),
  );
  const salesByDay = computeSalesFromStockSequence(stocksFull)
    .slice(reportOffset)
    .map((x, index) => applyRecountDayToSales(x.sales, datesReport[index]!, recountDays));
  const revenueByDay = salesByDay.map((sales, i) =>
    computeRevenueForDay(sales, prices[i] ?? null)
  );
  const totalSales = salesByDay.reduce((acc, val) => acc + val, 0);
  const totalRevenue = revenueByDay.reduce((acc, val) => acc + val, 0);
  return {
    salesByDay,
    revenueByDay,
    prices,
    isRecountDayByDay,
    totalSales,
    totalRevenue,
  };
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

function setMergedMetaAlignment(cell: ExcelJS.Cell): void {
  const prev = cell.alignment ?? {};
  cell.alignment = {
    ...prev,
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
}

function writeSummaryRow(
  sheet: ExcelJS.Worksheet,
  rowIndex: number,
  label: string,
  value: number
): void {
  const row = sheet.getRow(rowIndex);
  row.getCell(1).value = label;
  row.getCell(2).value = value;
  row.getCell(1).font = { ...(row.getCell(1).font ?? {}), bold: true };
}

function applyRevenueRowBold(
  sheet: ExcelJS.Worksheet,
  rowIndex: number,
  fromCol: number,
  toCol: number
): void {
  const row = sheet.getRow(rowIndex);
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.font = { ...(cell.font ?? {}), bold: true };
  }
}

export async function buildSkuSalesExcelForSkus(
  skus: SkuSalesExcelSkuRow[],
  dateFrom: Date,
  dateTo: Date,
  getItem: (
    konkName: string,
    productId: string,
    sliceDate: Date
  ) => ISkuSliceDataItem | null | undefined,
  options: SkuSalesExcelOptions = {}
): Promise<{ buffer: Buffer }> {
  const datesReport = enumerateSliceDates(dateFrom, dateTo);
  const dates = datesReport;
  const dateCount = dates.length;
  const dataStartCol = METRIC_LABEL_COL + 1;
  const totalCol = dataStartCol + dateCount;
  const columnCount = totalCol;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Продажі");

  const headerRow = sheet.getRow(1);
  for (let i = 0; i < HEADER_LABELS.length; i++) {
    headerRow.getCell(i + 1).value = HEADER_LABELS[i];
  }
  headerRow.getCell(METRIC_LABEL_COL).value = "";
  dates.forEach((d, index) => {
    headerRow.getCell(dataStartCol + index).value = formatExcelDateHeaderUk(d);
  });
  headerRow.getCell(totalCol).value = "Всього";
  applyHeaderStyle(sheet, columnCount);

  const summaryMode = options.summaryMode ?? "bottomOnly";
  const summarySalesLabel =
    options.summarySalesLabel ?? "Продажі конкурента (всього), шт";
  const summaryRevenueLabel =
    options.summaryRevenueLabel ?? "Виручка конкурента (всього), грн";
  const recountDays = new Set((options.recountDays ?? []).map(String));

  let grandTotalSales = 0;
  let grandTotalRevenue = 0;
  let startRow = 2;

  for (const sku of skus) {
    const {
      salesByDay,
      revenueByDay,
      prices,
      isRecountDayByDay,
      totalSales,
      totalRevenue,
    } = computeSkuSalesPeriodMetrics(
      sku,
      dateFrom,
      dateTo,
      getItem,
      recountDays,
    );
    grandTotalSales += totalSales;
    grandTotalRevenue += totalRevenue;

    const salesRow = sheet.getRow(startRow);
    const priceRow = sheet.getRow(startRow + 1);
    const revenueRow = sheet.getRow(startRow + 2);

    salesRow.getCell(1).value = sku.productId;
    salesRow.getCell(2).value = sku.title;
    salesRow.getCell(3).value = sku.competitorTitle;
    salesRow.getCell(4).value = sku.producerName;
    salesRow.getCell(5).value = sku.skugrTitle ?? "";
    salesRow.getCell(6).value = sku.url;

    salesRow.getCell(METRIC_LABEL_COL).value = METRIC_LABELS[0];
    priceRow.getCell(METRIC_LABEL_COL).value = METRIC_LABELS[1];
    revenueRow.getCell(METRIC_LABEL_COL).value = METRIC_LABELS[2];

    for (let i = 0; i < dateCount; i++) {
      const col = dataStartCol + i;
      const salesCell = salesRow.getCell(col);
      salesCell.value = salesByDay[i] ?? null;
      if (isRecountDayByDay[i]) {
        salesCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: RECOUNT_DAY_PURPLE_FILL_ARGB },
        };
      }
      priceRow.getCell(col).value = prices[i] ?? null;
      revenueRow.getCell(col).value = revenueByDay[i] ?? null;
    }

    salesRow.getCell(totalCol).value = totalSales;
    priceRow.getCell(totalCol).value = null;
    revenueRow.getCell(totalCol).value = totalRevenue;

    for (let c = 1; c <= META_COL_COUNT; c++) {
      sheet.mergeCells(startRow, c, startRow + 2, c);
      setMergedMetaAlignment(salesRow.getCell(c));
    }

    for (let r = startRow; r <= startRow + 2; r++) {
      applyDataRowStyle(sheet, r, columnCount);
    }
    applyRevenueRowBold(sheet, startRow + 2, METRIC_LABEL_COL, totalCol);

    startRow += ROWS_PER_SKU_BLOCK;

    if (summaryMode === "perSku") {
      writeSummaryRow(sheet, startRow, summarySalesLabel, totalSales);
      writeSummaryRow(sheet, startRow + 1, summaryRevenueLabel, totalRevenue);
      startRow += 3;
    }
  }

  if (summaryMode === "bottomOnly") {
    writeSummaryRow(sheet, startRow, summarySalesLabel, grandTotalSales);
    writeSummaryRow(sheet, startRow + 1, summaryRevenueLabel, grandTotalRevenue);
  }

  for (let c = 1; c <= columnCount; c++) {
    sheet.getColumn(c).width = c >= dataStartCol && c < totalCol ? 22 : 14;
  }

  const buf = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buf) };
}
