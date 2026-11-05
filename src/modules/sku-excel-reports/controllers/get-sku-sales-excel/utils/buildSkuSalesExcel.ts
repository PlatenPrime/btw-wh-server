import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle } from "../../../../../lib/excel/worksheetStyles.js";
import { formatExcelDateHeaderUk } from "../../../../../lib/excel/formatExcelDateHeaderUk.js";
import type { ISkuSliceDataItem } from "../../../../sku-slices/models/skuSliceTypes.js";
import {
  notifyExcelBuildProgress,
  type ExcelBuildProgressHandler,
} from "../../../../../lib/excel/excelBuildProgress.js";
import {
  SKU_EXCEL_PHOTO_COLUMN_WIDTH,
  SKU_EXCEL_PHOTO_HEADER,
  embedSkuPreviewInCell,
  type SkuPreviewJpeg,
} from "../../../../../lib/excel/skuExcelPhoto.js";
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
import { computeSharePercent } from "../../../../sku-reporting/utils/computeSharePercent.js";

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
const RECOUNT_DAY_PURPLE_FILL_ARGB = "FF800080";
const DEFAULT_METRICS: readonly SkuSalesExcelMetric[] = SKU_SALES_EXCEL_METRICS;

export type SkuSalesExcelSkuRow = {
  title: string;
  url: string;
  productId: string;
  konkName: string;
  competitorTitle: string;
  producerName: string;
  /** Для ключа previews map при includeImages. */
  skuId?: string;
  imageUrl?: string;
  /** Заголовок Skugr для колонки «Товарна група»; пусто, если SKU не привязан. */
  skugrTitle?: string;
};

export type SkuSalesExcelOptions = {
  summaryMode?: "perSku" | "bottomOnly";
  summarySalesLabel?: string;
  summaryRevenueLabel?: string;
  recountDays?: string[];
  /** Per-konk recount; если задано — перекрывает общий `recountDays` для строки SKU. */
  recountDaysByKonk?: ReadonlyMap<string, ReadonlySet<string>>;
  /** После bottom summary — блок часток продажів/виручки по SKU. */
  includeShareBlock?: boolean;
  /** Подмножество строк метрик; без значения — все три. */
  metrics?: readonly SkuSalesExcelMetric[];
  includeImages?: boolean;
  previews?: ReadonlyMap<string, SkuPreviewJpeg>;
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

function resolveRecountDaysForSku(
  konkName: string,
  fallback: ReadonlySet<string>,
  byKonk?: ReadonlyMap<string, ReadonlySet<string>>,
): ReadonlySet<string> {
  return byKonk?.get(konkName) ?? fallback;
}

function writeShareBlock(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  skus: SkuSalesExcelSkuRow[],
  perSkuSales: number[],
  perSkuRevenue: number[],
  grandTotalSales: number,
  grandTotalRevenue: number,
): void {
  let row = startRow + 1;
  const titleRow = sheet.getRow(row);
  titleRow.getCell(1).value = "Частки за період";
  titleRow.getCell(1).font = { bold: true };
  row += 1;

  const header = sheet.getRow(row);
  header.getCell(1).value = "Ідентифікатор товару";
  header.getCell(2).value = "Назва";
  header.getCell(3).value = "Конкурент";
  header.getCell(4).value = "Продажі, шт";
  header.getCell(5).value = "Частка продажів, %";
  header.getCell(6).value = "Виручка, грн";
  header.getCell(7).value = "Частка виручки, %";
  for (let c = 1; c <= 7; c++) {
    header.getCell(c).font = { bold: true };
  }
  row += 1;

  for (let i = 0; i < skus.length; i++) {
    const sku = skus[i]!;
    const sales = perSkuSales[i] ?? 0;
    const revenue = perSkuRevenue[i] ?? 0;
    const dataRow = sheet.getRow(row);
    dataRow.getCell(1).value = sku.productId;
    dataRow.getCell(2).value = sku.title;
    dataRow.getCell(3).value = sku.competitorTitle;
    dataRow.getCell(4).value = sales;
    dataRow.getCell(5).value = computeSharePercent(sales, grandTotalSales);
    dataRow.getCell(6).value = revenue;
    dataRow.getCell(7).value = computeSharePercent(revenue, grandTotalRevenue);
    row += 1;
  }

  const totalRow = sheet.getRow(row);
  totalRow.getCell(1).value = "Разом";
  totalRow.getCell(4).value = grandTotalSales;
  totalRow.getCell(5).value = grandTotalSales === 0 ? 0 : 100;
  totalRow.getCell(6).value = grandTotalRevenue;
  totalRow.getCell(7).value = grandTotalRevenue === 0 ? 0 : 100;
  for (let c = 1; c <= 7; c++) {
    totalRow.getCell(c).font = { bold: true };
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
  const includeImages = options.includeImages === true;
  const photoOffset = includeImages ? 1 : 0;
  const firstMetaCol = 1 + photoOffset;
  const metricLabelCol = firstMetaCol + META_COL_COUNT;
  const datesReport = enumerateSliceDates(dateFrom, dateTo);
  const dates = datesReport;
  const dateCount = dates.length;
  const dataStartCol = metricLabelCol + 1;
  const totalCol = dataStartCol + dateCount;
  const columnCount = totalCol;
  const mergeEndCol = firstMetaCol + META_COL_COUNT - 1;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Продажі");

  const headerRow = sheet.getRow(1);
  if (includeImages) {
    headerRow.getCell(1).value = SKU_EXCEL_PHOTO_HEADER;
  }
  for (let i = 0; i < HEADER_LABELS.length; i++) {
    headerRow.getCell(firstMetaCol + i).value = HEADER_LABELS[i];
  }
  headerRow.getCell(metricLabelCol).value = "";
  dates.forEach((d, index) => {
    headerRow.getCell(dataStartCol + index).value = formatExcelDateHeaderUk(d);
  });
  headerRow.getCell(totalCol).value = "Всього";
  applyHeaderStyle(sheet, columnCount);
  if (includeImages) {
    sheet.getColumn(1).width = SKU_EXCEL_PHOTO_COLUMN_WIDTH;
  }

  const summaryMode = options.summaryMode ?? "bottomOnly";
  const summarySalesLabel = options.summarySalesLabel ?? "Продажі конкурента (всього), шт";
  const summaryRevenueLabel = options.summaryRevenueLabel ?? "Виручка конкурента (всього), грн";
  const recountDaysFallback = new Set((options.recountDays ?? []).map(String));
  const selectedMetrics =
    options.metrics && options.metrics.length > 0 ? options.metrics : DEFAULT_METRICS;
  const rowsPerSkuBlock = selectedMetrics.length;
  const includeSales = selectedMetrics.includes("sales");
  const includeRevenue = selectedMetrics.includes("revenue");

  let grandTotalSales = 0;
  let grandTotalRevenue = 0;
  const perSkuSales: number[] = [];
  const perSkuRevenue: number[] = [];
  let startRow = 2;
  const skuTotal = skus.length;

  for (let skuIndex = 0; skuIndex < skuTotal; skuIndex++) {
    const sku = skus[skuIndex]!;
    const recountDays = resolveRecountDaysForSku(
      sku.konkName,
      recountDaysFallback,
      options.recountDaysByKonk,
    );
    const { salesByDay, revenueByDay, prices, isRecountDayByDay, totalSales, totalRevenue } =
      computeSkuSalesPeriodMetrics(sku, dateFrom, dateTo, getItem, recountDays);
    grandTotalSales += totalSales;
    grandTotalRevenue += totalRevenue;
    perSkuSales.push(totalSales);
    perSkuRevenue.push(totalRevenue);

    const firstRow = sheet.getRow(startRow);
    firstRow.getCell(firstMetaCol).value = sku.productId;
    firstRow.getCell(firstMetaCol + 1).value = sku.title;
    firstRow.getCell(firstMetaCol + 2).value = sku.competitorTitle;
    firstRow.getCell(firstMetaCol + 3).value = sku.producerName;
    firstRow.getCell(firstMetaCol + 4).value = sku.skugrTitle ?? "";
    firstRow.getCell(firstMetaCol + 5).value = sku.url;

    for (let m = 0; m < selectedMetrics.length; m++) {
      const metric = selectedMetrics[m]!;
      const row = sheet.getRow(startRow + m);
      row.getCell(metricLabelCol).value = METRIC_LABEL_BY_KEY[metric];

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
    const mergeFromCol = includeImages ? 1 : firstMetaCol;
    if (rowsPerSkuBlock > 1) {
      for (let c = mergeFromCol; c <= mergeEndCol; c++) {
        sheet.mergeCells(startRow, c, endRow, c);
        setMergedMetaAlignment(firstRow.getCell(c));
      }
    } else {
      for (let c = mergeFromCol; c <= mergeEndCol; c++) {
        setMergedMetaAlignment(firstRow.getCell(c));
      }
    }

    if (includeImages && sku.skuId) {
      const preview = options.previews?.get(sku.skuId);
      if (preview) {
        embedSkuPreviewInCell({
          workbook,
          sheet,
          rowNumber: startRow,
          colIndex: 0,
          preview,
        });
      }
    }

    for (let r = startRow; r <= endRow; r++) {
      applyDataRowStyle(sheet, r, columnCount);
    }
    const revenueOffset = selectedMetrics.indexOf("revenue");
    if (revenueOffset >= 0) {
      applyRevenueRowBold(sheet, startRow + revenueOffset, metricLabelCol, totalCol);
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
    const afterSummary = writeSelectedSummaryRows(
      sheet,
      startRow,
      includeSales,
      includeRevenue,
      summarySalesLabel,
      summaryRevenueLabel,
      grandTotalSales,
      grandTotalRevenue,
    );
    startRow = afterSummary;
    if (options.includeShareBlock) {
      writeShareBlock(
        sheet,
        startRow,
        skus,
        perSkuSales,
        perSkuRevenue,
        grandTotalSales,
        grandTotalRevenue,
      );
    }
  }
  for (let c = 1; c <= columnCount; c++) {
    if (includeImages && c === 1) continue;
    sheet.getColumn(c).width = c >= dataStartCol && c < totalCol ? 22 : 14;
  }

  const buf = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buf) };
}
