import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../lib/excel/worksheetStyles.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { coalesceSkuSliceItemsAlongDates, sliceDateMinusDays, } from "./coalesceSkuSliceItemsForReporting.js";
/** Заливка комірки «Залишок»: день створення SKU (календар Kyiv). */
export const SKU_SLICE_EXCEL_STOCK_NEW_SKU_FILL_ARGB = "FFC8E6C9";
/** Заливка комірки «Залишок»: день зростання залишку vs попередній день періоду. */
export const SKU_SLICE_EXCEL_STOCK_SUPPLY_FILL_ARGB = "FFFFCDD2";
const HEADER_LABELS = [
    "Ідентифікатор товару",
    "Назва",
    "Конкурент",
    "Виробник",
    "Посилання",
];
const METRIC_LABELS = ["Залишок", "Ціна"];
const ROWS_PER_SKU_BLOCK = 2;
export function formatDateHeader(d) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function enumerateSliceDates(from, to) {
    const out = [];
    const cursor = new Date(from);
    while (cursor.getTime() <= to.getTime()) {
        out.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
}
export function safeFilePart(s) {
    return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}
function getFirstAndLastNumeric(values) {
    let first = null;
    let last = null;
    for (let i = 0; i < values.length && first === null; i++) {
        const raw = values[i];
        const val = typeof raw === "number" ? raw : Number(raw ?? NaN);
        if (Number.isFinite(val))
            first = val;
    }
    for (let i = values.length - 1; i >= 0 && last === null; i--) {
        const raw = values[i];
        const val = typeof raw === "number" ? raw : Number(raw ?? NaN);
        if (Number.isFinite(val))
            last = val;
    }
    if (first === null || last === null)
        return null;
    return { first, last };
}
function applyRowDiffAndPct(row, dateValues, dataStartCol, diffCol, diffPctCol) {
    const bounds = getFirstAndLastNumeric(dateValues);
    if (!bounds)
        return;
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
function applyStockDayCellHighlights(stockRow, dataStartCol, dates, createdAt) {
    const dateCount = dates.length;
    const newSkuDayMs = createdAt != null ? toSliceDate(createdAt).getTime() : null;
    for (let i = 0; i < dateCount; i++) {
        const sliceDayMs = toSliceDate(dates[i]).getTime();
        const currCell = stockRow.getCell(dataStartCol + i);
        if (newSkuDayMs != null && sliceDayMs === newSkuDayMs) {
            currCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: SKU_SLICE_EXCEL_STOCK_NEW_SKU_FILL_ARGB },
            };
            continue;
        }
        if (i < 1)
            continue;
        const prevCell = stockRow.getCell(dataStartCol + i - 1);
        const prevVal = typeof prevCell.value === "number"
            ? prevCell.value
            : Number(prevCell.value ?? NaN);
        const currVal = typeof currCell.value === "number"
            ? currCell.value
            : Number(currCell.value ?? NaN);
        if (!Number.isFinite(prevVal) || !Number.isFinite(currVal))
            continue;
        if (currVal > prevVal) {
            currCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: SKU_SLICE_EXCEL_STOCK_SUPPLY_FILL_ARGB },
            };
        }
    }
}
function highlightPriceChanges(priceRow, dataStartCol, dateCount) {
    for (let i = 1; i < dateCount; i++) {
        const prevCell = priceRow.getCell(dataStartCol + i - 1);
        const currCell = priceRow.getCell(dataStartCol + i);
        const prevVal = typeof prevCell.value === "number"
            ? prevCell.value
            : Number(prevCell.value ?? NaN);
        const currVal = typeof currCell.value === "number"
            ? currCell.value
            : Number(currCell.value ?? NaN);
        if (!Number.isFinite(prevVal) || !Number.isFinite(currVal))
            continue;
        if (currVal < prevVal) {
            currCell.font = {
                ...(currCell.font ?? {}),
                color: { argb: "FF00AA00" },
            };
        }
        else if (currVal > prevVal) {
            currCell.font = {
                ...(currCell.font ?? {}),
                color: { argb: "FFFF0000" },
            };
        }
    }
}
function setMergedMetaAlignment(cell) {
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
export async function buildSkuSliceExcelForSkus(skus, dateFrom, dateTo, getItem, titles, options = {}) {
    const datesReport = enumerateSliceDates(dateFrom, dateTo);
    const warmStart = sliceDateMinusDays(dateFrom, 1);
    const datesFull = warmStart.getTime() < dateFrom.getTime()
        ? [warmStart, ...datesReport]
        : datesReport;
    const reportOffset = datesFull.length - datesReport.length;
    const dates = datesReport;
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
    let totalDiff = 0;
    let totalFirstStock = 0;
    let startRow = 2;
    for (let s = 0; s < skus.length; s++) {
        const sku = skus[s];
        const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) => getItem(sku.konkName, sku.productId, d));
        const forReport = coalesced.slice(reportOffset);
        const stocks = forReport.map((c) => c.stock);
        const prices = forReport.map((c) => c.price);
        const stockRow = sheet.getRow(startRow);
        const priceRow = sheet.getRow(startRow + 1);
        stockRow.getCell(1).value = sku.productId;
        stockRow.getCell(2).value = sku.title;
        stockRow.getCell(3).value = titles.competitorTitle;
        stockRow.getCell(4).value = titles.producerName;
        stockRow.getCell(5).value = sku.url;
        stockRow.getCell(6).value = METRIC_LABELS[0];
        priceRow.getCell(6).value = METRIC_LABELS[1];
        for (let i = 0; i < dateCount; i++) {
            const col = dataStartCol + i;
            const st = stocks[i];
            const pr = prices[i];
            stockRow.getCell(col).value = st ?? null;
            priceRow.getCell(col).value = pr ?? null;
        }
        sheet.mergeCells(startRow, 1, startRow + 1, 1);
        sheet.mergeCells(startRow, 2, startRow + 1, 2);
        sheet.mergeCells(startRow, 3, startRow + 1, 3);
        sheet.mergeCells(startRow, 4, startRow + 1, 4);
        sheet.mergeCells(startRow, 5, startRow + 1, 5);
        for (const c of [1, 2, 3, 4, 5]) {
            setMergedMetaAlignment(stockRow.getCell(c));
        }
        applyRowDiffAndPct(stockRow, stocks, dataStartCol, diffCol, diffPctCol);
        applyRowDiffAndPct(priceRow, prices, dataStartCol, diffCol, diffPctCol);
        highlightPriceChanges(priceRow, dataStartCol, dateCount);
        for (let r = startRow; r <= startRow + 1; r++) {
            applyDataRowStyle(sheet, r, columnCount);
        }
        applyStockDayCellHighlights(stockRow, dataStartCol, dates, sku.createdAt);
        const stockBounds = getFirstAndLastNumeric(stocks);
        if (stockBounds) {
            totalDiff += stockBounds.last - stockBounds.first;
            totalFirstStock += stockBounds.first;
        }
        startRow += ROWS_PER_SKU_BLOCK;
    }
    if (options.includeTotalsRow) {
        const totalsRow = sheet.getRow(startRow);
        totalsRow.getCell(1).value = options.totalsRowLabel ?? "Підсумок";
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
        }
        else {
            totalDiffPctCell.value = Math.round((totalDiff / totalFirstStock) * 10000) / 100;
        }
        totalsRow.font = { ...(totalsRow.font ?? {}), bold: true };
        applyDataRowStyle(sheet, startRow, columnCount);
    }
    for (let c = 1; c <= columnCount; c++) {
        sheet.getColumn(c).width = 14;
    }
    const buf = await workbook.xlsx.writeBuffer();
    const fromS = formatDateHeader(dateFrom);
    const toS = formatDateHeader(dateTo);
    const nameBase = skus.length === 1
        ? `sku_slice_${safeFilePart(skus[0].productId)}_${fromS}_${toS}`
        : `sku_slice_konk_${fromS}_${toS}`;
    return {
        buffer: Buffer.from(buf),
        fileName: `${nameBase}.xlsx`,
    };
}
