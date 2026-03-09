import type ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../../lib/excel/worksheetStyles.js";
import type { AnalogBtradeCompareItem } from "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";
import {
  computeRevenueForDay,
  computeSalesFromStockSequence,
} from "./salesComparisonUtils.js";

const DELIVERY_DAY_RED = "FFFF0000";

export interface SetupSalesComparisonHeaderRowParams {
  worksheet: ExcelJS.Worksheet;
  items: AnalogBtradeCompareItem[];
  dataStartCol: number;
  totalCol: number;
  diffSalesCol: number;
  diffSalesPctCol: number;
  diffRevenueCol: number;
  diffRevenuePctCol: number;
  columnCount: number;
}

/**
 * Первая строка листа: колонки 1–4 (Артикул, Назва, Конкурент, Виробник), колонка 5 пустая,
 * далее даты, колонка «Всього», затем 4 колонки дельт.
 */
export function setupSalesComparisonHeaderRow(
  params: SetupSalesComparisonHeaderRowParams,
): void {
  const {
    worksheet,
    items,
    dataStartCol,
    totalCol,
    diffSalesCol,
    diffSalesPctCol,
    diffRevenueCol,
    diffRevenuePctCol,
    columnCount,
  } = params;

  const headerRow = worksheet.getRow(1);
  headerRow.getCell(1).value = "Артикул";
  headerRow.getCell(2).value = "Назва (укр)";
  headerRow.getCell(3).value = "Конкурент";
  headerRow.getCell(4).value = "Виробник";
  headerRow.getCell(5).value = "";

  items.forEach((item, index) => {
    const dateStr = item.date.toISOString().split("T")[0] ?? "";
    headerRow.getCell(index + dataStartCol).value = dateStr;
  });

  headerRow.getCell(totalCol).value = "Всього";
  headerRow.getCell(diffSalesCol).value = "Δ Продажі Btrade vs конкурент, шт";
  headerRow.getCell(diffSalesPctCol).value = "Δ Продажі Btrade vs конкурент, %";
  headerRow.getCell(diffRevenueCol).value = "Δ Виручка Btrade vs конкурент, грн";
  headerRow.getCell(diffRevenuePctCol).value =
    "Δ Виручка Btrade vs конкурент, %";

  applyHeaderStyle(worksheet, columnCount);

  const deltaHeaderCells = [
    headerRow.getCell(diffSalesCol),
    headerRow.getCell(diffSalesPctCol),
    headerRow.getCell(diffRevenueCol),
    headerRow.getCell(diffRevenuePctCol),
  ];
  for (const cell of deltaHeaderCells) {
    const prevAlignment = cell.alignment ?? {};
    cell.alignment = {
      ...prevAlignment,
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }
}

export interface SalesComparisonBlockTotals {
  totalAnalogSales: number;
  totalAnalogRevenue: number;
  totalBtradeSales: number;
  totalBtradeRevenue: number;
}

export interface BuildSalesComparisonExcelBlockOptions {
  worksheet: ExcelJS.Worksheet;
  startRow: number;
  dataStartCol: number;
  totalCol: number;
  diffSalesCol: number;
  diffSalesPctCol: number;
  diffRevenueCol: number;
  diffRevenuePctCol: number;
  columnCount: number;
  items: AnalogBtradeCompareItem[];
  artikul: string;
  artNameUkr: string | null;
  producerName?: string | null;
  competitorTitle?: string | null;
}

/**
 * Блок 6 строк на один аналог: продажи/ціна/виручка аналога и Btrade по датам,
 * колонка «Всього», 4 колонки дельт. Возвращает агрегаты для итога.
 */
export function buildSalesComparisonExcelBlock(
  options: BuildSalesComparisonExcelBlockOptions,
): SalesComparisonBlockTotals {
  const {
    worksheet,
    startRow,
    dataStartCol,
    totalCol,
    diffSalesCol,
    diffSalesPctCol,
    diffRevenueCol,
    diffRevenuePctCol,
    columnCount,
    items,
    artikul,
    artNameUkr,
    producerName,
    competitorTitle,
  } = options;

  const analogStockByDay = items.map((i) => i.analogStock);
  const btradeStockByDay = items.map((i) => i.btradeStock);

  const analogSalesResults = computeSalesFromStockSequence(analogStockByDay);
  const btradeSalesResults = computeSalesFromStockSequence(btradeStockByDay);

  let totalAnalogSales = 0;
  let totalAnalogRevenue = 0;
  let totalBtradeSales = 0;
  let totalBtradeRevenue = 0;

  const rows = [
    worksheet.getRow(startRow), // Продажі аналога
    worksheet.getRow(startRow + 1), // Ціна аналога
    worksheet.getRow(startRow + 2), // Виручка аналога
    worksheet.getRow(startRow + 3), // Продажі Btrade
    worksheet.getRow(startRow + 4), // Ціна Btrade
    worksheet.getRow(startRow + 5), // Виручка Btrade
  ];

  const labels = [
    "Продажі аналога",
    "Ціна аналога",
    "Виручка аналога",
    "Продажі Btrade",
    "Ціна Btrade",
    "Виручка Btrade",
  ];
  rows.forEach((row, i) => row.getCell(5).value = labels[i]);

  const safeProducerName = producerName ?? "";
  const safeCompetitorTitle = competitorTitle ?? "";
  const artName = artNameUkr ?? "";

  rows.forEach((row) => {
    row.getCell(1).value = artikul;
    row.getCell(2).value = artName;
    row.getCell(3).value = safeCompetitorTitle;
    row.getCell(4).value = safeProducerName;
  });

  worksheet.mergeCells(startRow, 1, startRow + 5, 1);
  worksheet.mergeCells(startRow, 2, startRow + 5, 2);
  worksheet.mergeCells(startRow, 3, startRow + 5, 3);
  worksheet.mergeCells(startRow, 4, startRow + 5, 4);

  items.forEach((item, index) => {
    const col = index + dataStartCol;
    const analogSales = analogSalesResults[index]!.sales;
    const analogIsDelivery = analogSalesResults[index]!.isDeliveryDay;
    const btradeSales = btradeSalesResults[index]!.sales;
    const btradeIsDelivery = btradeSalesResults[index]!.isDeliveryDay;

    const analogRevenue = computeRevenueForDay(analogSales, item.analogPrice);
    const btradeRevenue = computeRevenueForDay(btradeSales, item.btradePrice);

    totalAnalogSales += analogSales;
    totalAnalogRevenue += analogRevenue;
    totalBtradeSales += btradeSales;
    totalBtradeRevenue += btradeRevenue;

    // Row 0: Продажі аналога
    const cellAnalogSales = rows[0]!.getCell(col);
    cellAnalogSales.value = analogSales;
    if (analogIsDelivery && analogSales === 0) {
      cellAnalogSales.font = {
        ...(cellAnalogSales.font ?? {}),
        color: { argb: DELIVERY_DAY_RED },
      };
    }

    // Row 1: Ціна аналога
    rows[1]!.getCell(col).value = item.analogPrice ?? null;

    // Row 2: Виручка аналога
    rows[2]!.getCell(col).value = analogRevenue;

    // Row 3: Продажі Btrade
    const cellBtradeSales = rows[3]!.getCell(col);
    cellBtradeSales.value = btradeSales;
    if (btradeIsDelivery && btradeSales === 0) {
      cellBtradeSales.font = {
        ...(cellBtradeSales.font ?? {}),
        color: { argb: DELIVERY_DAY_RED },
      };
    }

    // Row 4: Ціна Btrade
    rows[4]!.getCell(col).value = item.btradePrice ?? null;

    // Row 5: Виручка Btrade
    rows[5]!.getCell(col).value = btradeRevenue;
  });

  // Колонка «Всього»: суммы для продаж и выручки, цены пустые
  rows[0]!.getCell(totalCol).value = totalAnalogSales;
  rows[1]!.getCell(totalCol).value = null;
  rows[2]!.getCell(totalCol).value = totalAnalogRevenue;
  rows[3]!.getCell(totalCol).value = totalBtradeSales;
  rows[4]!.getCell(totalCol).value = null;
  rows[5]!.getCell(totalCol).value = totalBtradeRevenue;

  // 4 колонки дельт (объединяем по 6 строк)
  const diffSalesPieces = totalBtradeSales - totalAnalogSales;
  const diffRevenueUah = totalBtradeRevenue - totalAnalogRevenue;

  const diffSalesCell = rows[0]!.getCell(diffSalesCol);
  diffSalesCell.value = diffSalesPieces;
  if (Number.isFinite(diffSalesPieces) && diffSalesPieces !== 0) {
    diffSalesCell.font = {
      ...(diffSalesCell.font ?? {}),
      color:
        diffSalesPieces > 0 ? { argb: "FF00AA00" } : { argb: DELIVERY_DAY_RED },
    };
  }

  const diffSalesPctCell = rows[0]!.getCell(diffSalesPctCol);
  if (totalAnalogSales === 0) {
    diffSalesPctCell.value = null;
    diffSalesPctCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC0CB" },
    };
  } else {
    const pct = (totalBtradeSales / totalAnalogSales - 1) * 100;
    const rounded = Math.round(pct * 100) / 100;
    diffSalesPctCell.value = rounded / 100;
    diffSalesPctCell.numFmt = "0.00%";
    if (rounded !== 0) {
      diffSalesPctCell.font = {
        ...(diffSalesPctCell.font ?? {}),
        color:
          rounded > 0 ? { argb: "FF00AA00" } : { argb: DELIVERY_DAY_RED },
      };
    }
  }

  const diffRevenueCell = rows[0]!.getCell(diffRevenueCol);
  diffRevenueCell.value = diffRevenueUah;
  if (Number.isFinite(diffRevenueUah) && diffRevenueUah !== 0) {
    diffRevenueCell.font = {
      ...(diffRevenueCell.font ?? {}),
      color:
        diffRevenueUah > 0
          ? { argb: "FF00AA00" }
          : { argb: DELIVERY_DAY_RED },
    };
  }

  const diffRevenuePctCell = rows[0]!.getCell(diffRevenuePctCol);
  if (totalAnalogRevenue === 0) {
    diffRevenuePctCell.value = null;
    diffRevenuePctCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC0CB" },
    };
  } else {
    const pct = (totalBtradeRevenue / totalAnalogRevenue - 1) * 100;
    const rounded = Math.round(pct * 100) / 100;
    diffRevenuePctCell.value = rounded / 100;
    diffRevenuePctCell.numFmt = "0.00%";
    if (rounded !== 0) {
      diffRevenuePctCell.font = {
        ...(diffRevenuePctCell.font ?? {}),
        color:
          rounded > 0 ? { argb: "FF00AA00" } : { argb: DELIVERY_DAY_RED },
      };
    }
  }

  worksheet.mergeCells(startRow, diffSalesCol, startRow + 5, diffSalesCol);
  worksheet.mergeCells(startRow, diffSalesPctCol, startRow + 5, diffSalesPctCol);
  worksheet.mergeCells(startRow, diffRevenueCol, startRow + 5, diffRevenueCol);
  worksheet.mergeCells(startRow, diffRevenuePctCol, startRow + 5, diffRevenuePctCol);

  const deltaCells = [
    rows[0]!.getCell(diffSalesCol),
    rows[0]!.getCell(diffSalesPctCol),
    rows[0]!.getCell(diffRevenueCol),
    rows[0]!.getCell(diffRevenuePctCol),
  ];
  for (const cell of deltaCells) {
    const prevAlignment = cell.alignment ?? {};
    cell.alignment = {
      ...prevAlignment,
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  for (let r = 0; r < 6; r++) {
    applyDataRowStyle(worksheet, startRow + r, columnCount);
  }

  return {
    totalAnalogSales,
    totalAnalogRevenue,
    totalBtradeSales,
    totalBtradeRevenue,
  };
}

export interface BuildSalesComparisonSummaryBlockOptions {
  worksheet: ExcelJS.Worksheet;
  startRow: number;
  keyCol: number;
  valueCol: number;
  totalAnalogSales: number;
  totalAnalogRevenue: number;
  totalBtradeSales: number;
  totalBtradeRevenue: number;
}

/**
 * Итоговая секция под таблицей: две колонки (ключ – значение).
 */
export function buildSalesComparisonSummaryBlock(
  options: BuildSalesComparisonSummaryBlockOptions,
): void {
  const {
    worksheet,
    startRow,
    keyCol,
    valueCol,
    totalAnalogSales,
    totalAnalogRevenue,
    totalBtradeSales,
    totalBtradeRevenue,
  } = options;

  const diffSalesPieces = totalBtradeSales - totalAnalogSales;
  const diffRevenueUah = totalBtradeRevenue - totalAnalogRevenue;
  const diffSalesPct =
    totalAnalogSales === 0
      ? null
      : (totalBtradeSales / totalAnalogSales - 1) * 100;
  const diffRevenuePct =
    totalAnalogRevenue === 0
      ? null
      : (totalBtradeRevenue / totalAnalogRevenue - 1) * 100;

  const entries: [string, number | null][] = [
    ["Продажі конкурента (всього)", totalAnalogSales],
    ["Продажі Btrade (всього)", totalBtradeSales],
    ["Виручка конкурента (всього)", totalAnalogRevenue],
    ["Виручка Btrade (всього)", totalBtradeRevenue],
    ["Δ Продажі, шт", diffSalesPieces],
    ["Δ Виручка, грн", diffRevenueUah],
    [
      "Δ Продажі, %",
      diffSalesPct !== null ? Math.round(diffSalesPct * 100) / 100 : null,
    ],
    [
      "Δ Виручка, %",
      diffRevenuePct !== null ? Math.round(diffRevenuePct * 100) / 100 : null,
    ],
  ];

  entries.forEach(([key, value], index) => {
    const row = worksheet.getRow(startRow + index);
    row.getCell(keyCol).value = key;
    row.getCell(valueCol).value = value;
    if (value !== null && (key.startsWith("Δ Продажі, %") || key.startsWith("Δ Виручка, %"))) {
      row.getCell(valueCol).numFmt = "0.00%";
      row.getCell(valueCol).value = (value as number) / 100;
    }
    row.getCell(keyCol).font = { ...(row.getCell(keyCol).font ?? {}), bold: true };
  });
}
