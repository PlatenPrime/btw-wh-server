import ExcelJS from "exceljs";
import {
  notifyExcelBuildProgress,
  type ExcelBuildProgressHandler,
} from "../../../lib/excel/excelBuildProgress.js";
import { applyDataRowStyle, applyHeaderStyle } from "../../../lib/excel/worksheetStyles.js";
import { formatExcelDateHeaderUk } from "../../../lib/excel/formatExcelDateHeaderUk.js";
import {
  SKU_EXCEL_PHOTO_COLUMN_WIDTH,
  SKU_EXCEL_PHOTO_HEADER,
  embedSkuPreviewInCell,
  type SkuPreviewJpeg,
} from "../../../lib/excel/skuExcelPhoto.js";
import { enumerateSliceDates } from "../../slices/utils/enumerateSliceDates.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import type { ISkuSliceDataItem } from "../../sku-slices/models/skuSliceTypes.js";
import {
  coalesceSkuSliceItemsAlongDates,
  sliceDateMinusDays,
} from "./coalesceSkuSliceItemsForReporting.js";
import {
  SKU_STOCK_EXCEL_METRICS,
  type SkuStockExcelMetric,
} from "../schemas/skuStockExcelMetricsSchema.js";

/** Заливка комірки «Залишок»: день створення SKU (календар Kyiv). */
export const SKU_SLICE_EXCEL_STOCK_NEW_SKU_FILL_ARGB = "FFC8E6C9";
/** Заливка комірки «Залишок»: день зростання залишку vs попередній день періоду. */
export const SKU_SLICE_EXCEL_STOCK_SUPPLY_FILL_ARGB = "FFFFCDD2";

export const SKU_SLICE_EXCEL_SHEET_NAME = "Срез";

export const SKU_SLICE_EXCEL_HEADER_LABELS = [
  "Ідентифікатор товару",
  "Назва",
  "Конкурент",
  "Виробник",
  "Товарна група",
  "Посилання",
] as const;

export const SKU_SLICE_EXCEL_METRIC_LABELS = ["Залишок", "Ціна"] as const;

const HEADER_LABELS = SKU_SLICE_EXCEL_HEADER_LABELS;
const METRIC_LABEL_BY_KEY: Record<SkuStockExcelMetric, string> = {
  stock: SKU_SLICE_EXCEL_METRIC_LABELS[0],
  price: SKU_SLICE_EXCEL_METRIC_LABELS[1],
};
const DEFAULT_METRICS: readonly SkuStockExcelMetric[] = SKU_STOCK_EXCEL_METRICS;

const META_COL_COUNT = HEADER_LABELS.length;

export function formatDateHeader(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  /** Для ключа previews map при includeImages. */
  skuId?: string;
  imageUrl?: string;
  /** Заголовок конкурента; якщо задано — має пріоритет над titles.competitorTitle. */
  competitorTitle?: string;
  /** Заголовок виробника для колонки «Виробник»; якщо задано — має пріоритет над titles.producerName. */
  producerName?: string;
  /** Заголовок Skugr для колонки «Товарна група»; пусто, если SKU не привязан. */
  skugrTitle?: string;
  /** Для підсвітки «новинки»: день `toSliceDate(createdAt)` у колонках дат. */
  createdAt?: Date;
};

export type SkuSliceExcelTitles = {
  competitorTitle: string;
  producerName: string;
};

export type SkuSliceExcelOptions = {
  includeTotalsRow?: boolean;
  totalsRowLabel?: string;
  /** Подмножество строк метрик; без значения — stock + price. */
  metrics?: readonly SkuStockExcelMetric[];
  /** Колонка «Фото» зліва; потрібні skuId + previews. */
  includeImages?: boolean;
  previews?: ReadonlyMap<string, SkuPreviewJpeg>;
  onProgress?: ExcelBuildProgressHandler;
};

function getFirstAndLastNumeric(
  values: (number | null | undefined)[],
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
  diffPctCol: number,
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

function applyStockDayCellHighlights(
  stockRow: ExcelJS.Row,
  dataStartCol: number,
  dates: Date[],
  createdAt?: Date,
): void {
  const dateCount = dates.length;
  const newSkuDayMs = createdAt != null ? toSliceDate(createdAt).getTime() : null;

  for (let i = 0; i < dateCount; i++) {
    const sliceDayMs = toSliceDate(dates[i]!).getTime();
    const currCell = stockRow.getCell(dataStartCol + i);

    if (newSkuDayMs != null && sliceDayMs === newSkuDayMs) {
      currCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: SKU_SLICE_EXCEL_STOCK_NEW_SKU_FILL_ARGB },
      };
      continue;
    }

    if (i < 1) continue;

    const prevCell = stockRow.getCell(dataStartCol + i - 1);
    const prevVal =
      typeof prevCell.value === "number" ? prevCell.value : Number(prevCell.value ?? NaN);
    const currVal =
      typeof currCell.value === "number" ? currCell.value : Number(currCell.value ?? NaN);
    if (!Number.isFinite(prevVal) || !Number.isFinite(currVal)) continue;
    if (currVal > prevVal) {
      currCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: SKU_SLICE_EXCEL_STOCK_SUPPLY_FILL_ARGB },
      };
    }
  }
}

function highlightPriceChanges(
  priceRow: ExcelJS.Row,
  dataStartCol: number,
  dateCount: number,
): void {
  for (let i = 1; i < dateCount; i++) {
    const prevCell = priceRow.getCell(dataStartCol + i - 1);
    const currCell = priceRow.getCell(dataStartCol + i);
    const prevVal =
      typeof prevCell.value === "number" ? prevCell.value : Number(prevCell.value ?? NaN);
    const currVal =
      typeof currCell.value === "number" ? currCell.value : Number(currCell.value ?? NaN);
    if (!Number.isFinite(prevVal) || !Number.isFinite(currVal)) continue;
    if (currVal < prevVal) {
      currCell.font = {
        ...(currCell.font ?? {}),
        color: { argb: "FF00AA00" },
      };
    } else if (currVal > prevVal) {
      currCell.font = {
        ...(currCell.font ?? {}),
        color: { argb: "FFFF0000" },
      };
    }
  }
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
 * Excel: блоки по SKU (Залишок / Ціна), колонка F — підписи метрик,
 * дати з G, потім «Різниця» та «Різниця, %».
 */
export async function buildSkuSliceExcelForSkus(
  skus: SkuSliceExcelSkuRow[],
  dateFrom: Date,
  dateTo: Date,
  getItem: (
    konkName: string,
    productId: string,
    sliceDate: Date,
  ) => ISkuSliceDataItem | null | undefined,
  titles: SkuSliceExcelTitles,
  options: SkuSliceExcelOptions = {},
): Promise<{ buffer: Buffer; fileName: string }> {
  const includeImages = options.includeImages === true;
  const photoOffset = includeImages ? 1 : 0;
  const firstMetaCol = 1 + photoOffset;
  const metricLabelCol = firstMetaCol + META_COL_COUNT;
  const datesReport = enumerateSliceDates(dateFrom, dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);
  const datesFull =
    warmStart.getTime() < dateFrom.getTime() ? [warmStart, ...datesReport] : datesReport;
  const reportOffset = datesFull.length - datesReport.length;
  const dates = datesReport;
  const dateCount = dates.length;
  const dataStartCol = metricLabelCol + 1;
  const diffCol = dataStartCol + dateCount;
  const diffPctCol = diffCol + 1;
  const columnCount = diffPctCol;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SKU_SLICE_EXCEL_SHEET_NAME);

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
  headerRow.getCell(diffCol).value = "Різниця";
  headerRow.getCell(diffPctCol).value = "Різниця, %";

  applyHeaderStyle(sheet, columnCount);
  if (includeImages) {
    sheet.getColumn(1).width = SKU_EXCEL_PHOTO_COLUMN_WIDTH;
  }

  const selectedMetrics =
    options.metrics && options.metrics.length > 0 ? options.metrics : DEFAULT_METRICS;
  const rowsPerSkuBlock = selectedMetrics.length;
  const includeStock = selectedMetrics.includes("stock");
  const mergeEndCol = firstMetaCol + META_COL_COUNT - 1;

  let totalDiff = 0;
  let totalFirstStock = 0;
  let startRow = 2;
  const skuTotal = skus.length;
  for (let s = 0; s < skuTotal; s++) {
    const sku = skus[s]!;
    const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) =>
      getItem(sku.konkName, sku.productId, d),
    );
    const forReport = coalesced.slice(reportOffset);
    const stocks = forReport.map((c) => c.stock);
    const prices = forReport.map((c) => c.price);

    const firstRow = sheet.getRow(startRow);
    firstRow.getCell(firstMetaCol).value = sku.productId;
    firstRow.getCell(firstMetaCol + 1).value = sku.title;
    firstRow.getCell(firstMetaCol + 2).value = sku.competitorTitle ?? titles.competitorTitle;
    firstRow.getCell(firstMetaCol + 3).value = sku.producerName ?? titles.producerName;
    firstRow.getCell(firstMetaCol + 4).value = sku.skugrTitle ?? "";
    firstRow.getCell(firstMetaCol + 5).value = sku.url;

    for (let m = 0; m < selectedMetrics.length; m++) {
      const metric = selectedMetrics[m]!;
      const row = sheet.getRow(startRow + m);
      row.getCell(metricLabelCol).value = METRIC_LABEL_BY_KEY[metric];
      const values = metric === "stock" ? stocks : prices;

      for (let i = 0; i < dateCount; i++) {
        row.getCell(dataStartCol + i).value = values[i] ?? null;
      }

      applyRowDiffAndPct(row, values, dataStartCol, diffCol, diffPctCol);

      if (metric === "price") {
        highlightPriceChanges(row, dataStartCol, dateCount);
      } else {
        applyStockDayCellHighlights(row, dataStartCol, dates, sku.createdAt);
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

    if (includeStock) {
      const stockBounds = getFirstAndLastNumeric(stocks);
      if (stockBounds) {
        totalDiff += stockBounds.last - stockBounds.first;
        totalFirstStock += stockBounds.first;
      }
    }

    startRow += rowsPerSkuBlock;
    notifyExcelBuildProgress(options.onProgress, s + 1, skuTotal);
  }

  if (options.includeTotalsRow && includeStock) {
    const totalsRow = sheet.getRow(startRow);
    totalsRow.getCell(firstMetaCol).value = options.totalsRowLabel ?? "Підсумок";
    totalsRow.getCell(diffCol).value = totalDiff;

    const totalDiffPctCell = totalsRow.getCell(diffPctCol);
    if (totalFirstStock === 0) {
      totalDiffPctCell.value = null;
      totalDiffPctCell.fill = {
        ...(totalDiffPctCell.fill ?? {}),
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC0CB" },
      };
    } else {
      totalDiffPctCell.value = Math.round((totalDiff / totalFirstStock) * 10000) / 100;
    }

    totalsRow.font = { ...(totalsRow.font ?? {}), bold: true };
    applyDataRowStyle(sheet, startRow, columnCount);
  }

  for (let c = 1; c <= columnCount; c++) {
    if (includeImages && c === 1) continue;
    sheet.getColumn(c).width = c >= dataStartCol && c < diffCol ? 22 : 14;
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
