import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle } from "../../../../../lib/excel/worksheetStyles.js";
import { formatExcelDateHeaderUk } from "../../../../../lib/excel/formatExcelDateHeaderUk.js";
import type { ISkuSliceDataItem } from "../../../../sku-slices/models/skuSliceTypes.js";
import {
  notifyExcelBuildProgress,
  type ExcelBuildProgressHandler,
} from "../../../../../lib/excel/excelBuildProgress.js";
import {
  applyRecountDayToSales,
  computeRevenueForDay,
  computeSalesFromStockSequence,
  toUtcDateKey,
} from "../../../../slices/utils/salesComparisonUtils.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import {
  coalesceSkuSliceItemsAlongDates,
  sliceDateMinusDays,
} from "../../../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import {
  SKU_SALES_EXCEL_METRICS,
  type SkuSalesExcelMetric,
} from "../../../../sku-reporting/schemas/skuSalesExcelMetricsSchema.js";

const HEADER_LABELS = [
  "Ідентифікатор товару",
  "Назва",
  "Конкурент",
  "Виробник",
  "Товарна група",
  "Посилання",
] as const;

const METRIC_LABEL_BY_KEY: Record<SkuSalesExcelMetric, string> = {
  sales: "Продажі",
  price: "Ціна",
  revenue: "Виручка",
};
const META_COL_COUNT = HEADER_LABELS.length;
const METRIC_LABEL_COL = META_COL_COUNT + 1;
const RECOUNT_DAY_PURPLE_FILL_ARGB = "FF800080";
const DEFAULT_METRICS: readonly SkuSalesExcelMetric[] = SKU_SALES_EXCEL_METRICS;

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
  /** Подмножество строк метрик; без значения — все три. */
  metrics?: readonly SkuSalesExcelMetric[];
  onProgress?: ExcelBuildProgressHandler;
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
    sliceDate: Date,
  ) => ISkuSliceDataItem | null | undefined,
  recountDays: ReadonlySet<string> = new Set(),
): SkuSalesPeriodMetrics {
  const datesReport = enumerateSliceDates(dateFrom, dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);
  const datesFull =
    warmStart.getTime() < dateFrom.getTime() ? [warmStart, ...datesReport] : datesReport;
  const reportOffset = datesFull.length - datesReport.length;
  const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) =>
    getItem(sku.konkName, sku.productId, d),
  );
  const forReport = coalesced.slice(reportOffset);
  const stocksFull = coalesced.map((c) => c.stock);
  const prices = forReport.map((c) => c.price);
  const isRecountDayByDay = datesReport.map((date) => recountDays.has(toUtcDateKey(date)));
  const salesByDay = computeSalesFromStockSequence(stocksFull)
    .slice(reportOffset)
    .map((x, index) => applyRecountDayToSales(x.sales, datesReport[index]!, recountDays));
  const revenueByDay = salesByDay.map((sales, i) => computeRevenueForDay(sales, prices[i] ?? null));
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
  value: number,
): void {
  const row = sheet.getRow(rowIndex);
  row.getCell(1).value = label;
  row.getCell(2).value = value;
  row.getCell(1).font = { ...(row.getCell(1).font ?? {}), bold: true };
}

function writeSelectedSummaryRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  includeSales: boolean,
  includeRevenue: boolean,
  summarySalesLabel: string,
  summaryRevenueLabel: string,
  salesValue: number,
  revenueValue: number,
): number {
  let row = startRow;
  if (includeSales) {
    writeSummaryRow(sheet, row, summarySalesLabel, salesValue);
    row += 1;
  }
  if (includeRevenue) {
    writeSummaryRow(sheet, row, summaryRevenueLabel, revenueValue);
    row += 1;
  }
  return row;
}

function applyRevenueRowBold(
  sheet: ExcelJS.Worksheet,
  rowIndex: number,
  fromCol: number,
  toCol: number,
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
    sliceDate: Date,
  ) => ISkuSliceDataItem | null | undefined,
  options: SkuSalesExcelOptions = {},
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
  const summarySalesLabel = options.summarySalesLabel ?? "Продажі конкурента (всього), шт";
  const summaryRevenueLabel = options.summaryRevenueLabel ?? "Виручка конкурента (всього), грн";
  const recountDays = new Set((options.recountDays ?? []).map(String));
  const selectedMetrics =
    options.metrics && options.metrics.length > 0 ? options.metrics : DEFAULT_METRICS;
  const rowsPerSkuBlock = selectedMetrics.length;
  const includeSales = selectedMetrics.includes("sales");
  const includeRevenue = selectedMetrics.includes("revenue");

  let grandTotalSales = 0;
  let grandTotalRevenue = 0;
  let startRow = 2;
  const skuTotal = skus.length;

  for (let skuIndex = 0; skuIndex < skuTotal; skuIndex++) {
    const sku = skus[skuIndex]!;
    const { salesByDay, revenueByDay, prices, isRecountDayByDay, totalSales, totalRevenue } =
      computeSkuSalesPeriodMetrics(sku, dateFrom, dateTo, getItem, recountDays);
    grandTotalSales += totalSales;
    grandTotalRevenue += totalRevenue;

    const firstRow = sheet.getRow(startRow);
    firstRow.getCell(1).value = sku.productId;
    firstRow.getCell(2).value = sku.title;
    firstRow.getCell(3).value = sku.competitorTitle;
    firstRow.getCell(4).value = sku.producerName;
    firstRow.getCell(5).value = sku.skugrTitle ?? "";
    firstRow.getCell(6).value = sku.url;

    for (let m = 0; m < selectedMetrics.length; m++) {
      const metric = selectedMetrics[m]!;
      const row = sheet.getRow(startRow + m);
      row.getCell(METRIC_LABEL_COL).value = METRIC_LABEL_BY_KEY[metric];

      for (let i = 0; i < dateCount; i++) {
        const col = dataStartCol + i;
        const cell = row.getCell(col);
        if (metric === "sales") {
          cell.value = salesByDay[i] ?? null;
          if (isRecountDayByDay[i]) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: RECOUNT_DAY_PURPLE_FILL_ARGB },
            };
          }
        } else if (metric === "price") {
          cell.value = prices[i] ?? null;
        } else {
          cell.value = revenueByDay[i] ?? null;
        }
      }

      if (metric === "sales") {
        row.getCell(totalCol).value = totalSales;
      } else if (metric === "price") {
        row.getCell(totalCol).value = null;
      } else {
        row.getCell(totalCol).value = totalRevenue;
      }
    }

    const endRow = startRow + rowsPerSkuBlock - 1;
    if (rowsPerSkuBlock > 1) {
      for (let c = 1; c <= META_COL_COUNT; c++) {
        sheet.mergeCells(startRow, c, endRow, c);
        setMergedMetaAlignment(firstRow.getCell(c));
      }
    } else {
      for (let c = 1; c <= META_COL_COUNT; c++) {
        setMergedMetaAlignment(firstRow.getCell(c));
      }
    }

    for (let r = startRow; r <= endRow; r++) {
      applyDataRowStyle(sheet, r, columnCount);
    }
    const revenueOffset = selectedMetrics.indexOf("revenue");
    if (revenueOffset >= 0) {
      applyRevenueRowBold(sheet, startRow + revenueOffset, METRIC_LABEL_COL, totalCol);
    }

    startRow += rowsPerSkuBlock;

    if (summaryMode === "perSku") {
      const afterSummary = writeSelectedSummaryRows(
        sheet,
        startRow,
        includeSales,
        includeRevenue,
        summarySalesLabel,
        summaryRevenueLabel,
        totalSales,
        totalRevenue,
      );
      // Как раньше при двух summary-строках: +1 пустая между блоками.
      startRow = afterSummary > startRow ? afterSummary + 1 : afterSummary;
    }
    notifyExcelBuildProgress(options.onProgress, skuIndex + 1, skuTotal);
  }

  if (summaryMode === "bottomOnly") {
    writeSelectedSummaryRows(
      sheet,
      startRow,
      includeSales,
      includeRevenue,
      summarySalesLabel,
      summaryRevenueLabel,
      grandTotalSales,
      grandTotalRevenue,
    );
  }
  for (let c = 1; c <= columnCount; c++) {
    sheet.getColumn(c).width = c >= dataStartCol && c < totalCol ? 22 : 14;
  }

  const buf = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buf) };
}
