import ExcelJS from "exceljs";
import { applyDataRowStyle, applyHeaderStyle, } from "../../../../../lib/excel/worksheetStyles.js";
import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { coalesceSkuSliceItemsAlongDates, sliceDateMinusDays, } from "../../../utils/coalesceSkuSliceItemsForReporting.js";
const HEADER_LABELS = [
    "Ідентифікатор товару",
    "Назва",
    "Конкурент",
    "Виробник",
    "Посилання",
];
const METRIC_LABELS = ["Продажі", "Ціна", "Виручка"];
const ROWS_PER_SKU_BLOCK = 3;
function formatDateHeader(d) {
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
function setMergedMetaAlignment(cell) {
    const prev = cell.alignment ?? {};
    cell.alignment = {
        ...prev,
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
    };
}
function writeSummaryRow(sheet, rowIndex, label, value) {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    row.getCell(1).font = { ...(row.getCell(1).font ?? {}), bold: true };
}
function applyRevenueRowBold(sheet, rowIndex, fromCol, toCol) {
    const row = sheet.getRow(rowIndex);
    for (let c = fromCol; c <= toCol; c++) {
        const cell = row.getCell(c);
        cell.font = { ...(cell.font ?? {}), bold: true };
    }
}
export async function buildSkuSalesExcelForSkus(skus, dateFrom, dateTo, getItem, options = {}) {
    const datesReport = enumerateSliceDates(dateFrom, dateTo);
    const warmStart = sliceDateMinusDays(dateFrom, 1);
    const datesFull = warmStart.getTime() < dateFrom.getTime()
        ? [warmStart, ...datesReport]
        : datesReport;
    const reportOffset = datesFull.length - datesReport.length;
    const dates = datesReport;
    const dateCount = dates.length;
    const dataStartCol = 7;
    const totalCol = dataStartCol + dateCount;
    const columnCount = totalCol;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Продажі");
    const headerRow = sheet.getRow(1);
    for (let i = 0; i < HEADER_LABELS.length; i++) {
        headerRow.getCell(i + 1).value = HEADER_LABELS[i];
    }
    headerRow.getCell(6).value = "";
    dates.forEach((d, index) => {
        headerRow.getCell(dataStartCol + index).value = formatDateHeader(d);
    });
    headerRow.getCell(totalCol).value = "Всього";
    applyHeaderStyle(sheet, columnCount);
    const summaryMode = options.summaryMode ?? "bottomOnly";
    const summarySalesLabel = options.summarySalesLabel ?? "Продажі конкурента (всього), шт";
    const summaryRevenueLabel = options.summaryRevenueLabel ?? "Виручка конкурента (всього), грн";
    let grandTotalSales = 0;
    let grandTotalRevenue = 0;
    let startRow = 2;
    for (const sku of skus) {
        const coalesced = coalesceSkuSliceItemsAlongDates(datesFull, (d) => getItem(sku.konkName, sku.productId, d));
        const forReport = coalesced.slice(reportOffset);
        const stocks = forReport.map((c) => c.stock);
        const prices = forReport.map((c) => c.price);
        const salesByDay = computeSalesFromStockSequence(stocks).map((x) => x.sales);
        const revenueByDay = salesByDay.map((sales, i) => computeRevenueForDay(sales, prices[i] ?? null));
        const totalSales = salesByDay.reduce((acc, val) => acc + val, 0);
        const totalRevenue = revenueByDay.reduce((acc, val) => acc + val, 0);
        grandTotalSales += totalSales;
        grandTotalRevenue += totalRevenue;
        const salesRow = sheet.getRow(startRow);
        const priceRow = sheet.getRow(startRow + 1);
        const revenueRow = sheet.getRow(startRow + 2);
        salesRow.getCell(1).value = sku.productId;
        salesRow.getCell(2).value = sku.title;
        salesRow.getCell(3).value = sku.competitorTitle;
        salesRow.getCell(4).value = sku.producerName;
        salesRow.getCell(5).value = sku.url;
        salesRow.getCell(6).value = METRIC_LABELS[0];
        priceRow.getCell(6).value = METRIC_LABELS[1];
        revenueRow.getCell(6).value = METRIC_LABELS[2];
        for (let i = 0; i < dateCount; i++) {
            const col = dataStartCol + i;
            salesRow.getCell(col).value = salesByDay[i] ?? null;
            priceRow.getCell(col).value = prices[i] ?? null;
            revenueRow.getCell(col).value = revenueByDay[i] ?? null;
        }
        salesRow.getCell(totalCol).value = totalSales;
        priceRow.getCell(totalCol).value = null;
        revenueRow.getCell(totalCol).value = totalRevenue;
        sheet.mergeCells(startRow, 1, startRow + 2, 1);
        sheet.mergeCells(startRow, 2, startRow + 2, 2);
        sheet.mergeCells(startRow, 3, startRow + 2, 3);
        sheet.mergeCells(startRow, 4, startRow + 2, 4);
        sheet.mergeCells(startRow, 5, startRow + 2, 5);
        for (const c of [1, 2, 3, 4, 5]) {
            setMergedMetaAlignment(salesRow.getCell(c));
        }
        for (let r = startRow; r <= startRow + 2; r++) {
            applyDataRowStyle(sheet, r, columnCount);
        }
        applyRevenueRowBold(sheet, startRow + 2, 6, totalCol);
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
        sheet.getColumn(c).width = 14;
    }
    const buf = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buf) };
}
