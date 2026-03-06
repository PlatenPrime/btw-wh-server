import type ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../../lib/excel/worksheetStyles.js";
import type { AnalogBtradeCompareItem } from "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";

export interface BuildAnalogBtradeExcelBlockOptions {
  worksheet: ExcelJS.Worksheet;
  /**
   * Номер строки, с которой начинается блок (включительно).
   * Блок всегда занимает 4 строки: stock/price конкурента и Btrade.
   */
  startRow: number;
  /**
   * Колонка, с которой начинаются данные по датам.
   * В текущей реализации это 6 (колонка F).
   */
  dataStartCol: number;
  diffCol: number;
  diffPctCol: number;
  summaryDiffCol: number;
  summaryDiffPctCol: number;
  columnCount: number;

  items: AnalogBtradeCompareItem[];
  artikul: string;
  artNameUkr: string | null;
  producerName?: string | null;
  competitorTitle?: string | null;
}

export function setupAnalogBtradeHeaderRow(
  worksheet: ExcelJS.Worksheet,
  items: AnalogBtradeCompareItem[],
  dataStartCol: number,
  diffCol: number,
  diffPctCol: number,
  summaryDiffCol: number,
  summaryDiffPctCol: number,
  columnCount: number,
): void {
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

  headerRow.getCell(diffCol).value = "Різниця";
  headerRow.getCell(diffPctCol).value = "Різниця, %";
  headerRow.getCell(summaryDiffCol).value = "Δ Btrade vs конкурент, шт";
  headerRow.getCell(summaryDiffPctCol).value = "Δ Btrade vs конкурент, %";

  applyHeaderStyle(worksheet, columnCount);

  const summaryHeaderCells = [
    headerRow.getCell(summaryDiffCol),
    headerRow.getCell(summaryDiffPctCol),
  ];
  for (const cell of summaryHeaderCells) {
    const prevAlignment = cell.alignment ?? {};
    cell.alignment = {
      ...prevAlignment,
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  const refHeader = headerRow.getCell(summaryDiffCol);
  const pctHeader = headerRow.getCell(summaryDiffPctCol);
  pctHeader.font = refHeader.font;
  pctHeader.fill = refHeader.fill;
  pctHeader.border = refHeader.border;
  pctHeader.alignment = refHeader.alignment;
}

export interface AnalogBtradeBlockDeltas {
  deltaAnalog: number;
  deltaBtrade: number;
}

export function buildAnalogBtradeExcelBlock(
  options: BuildAnalogBtradeExcelBlockOptions,
): AnalogBtradeBlockDeltas | undefined {
  const {
    worksheet,
    startRow,
    dataStartCol,
    diffCol,
    diffPctCol,
    summaryDiffCol,
    summaryDiffPctCol,
    columnCount,
    items,
    artikul,
    artNameUkr,
    producerName,
    competitorTitle,
  } = options;

  let blockDeltas: AnalogBtradeBlockDeltas | undefined;
  const analogStockRow = worksheet.getRow(startRow);
  const analogPriceRow = worksheet.getRow(startRow + 1);
  const btradeStockRow = worksheet.getRow(startRow + 2);
  const btradePriceRow = worksheet.getRow(startRow + 3);

  const artName = artNameUkr ?? "";
  const safeProducerName = producerName ?? "";
  const safeCompetitorTitle = competitorTitle ?? "";

  analogStockRow.getCell(1).value = artikul;
  analogStockRow.getCell(2).value = artName;
  analogStockRow.getCell(3).value = safeCompetitorTitle;
  analogStockRow.getCell(4).value = safeProducerName;

  analogStockRow.getCell(5).value = "Залишок аналога";
  analogPriceRow.getCell(5).value = "Ціна аналога";
  btradeStockRow.getCell(5).value = "Залишок Btrade";
  btradePriceRow.getCell(5).value = "Ціна Btrade";

  items.forEach((item, index) => {
    const col = index + dataStartCol;
    analogStockRow.getCell(col).value = item.analogStock ?? null;
    analogPriceRow.getCell(col).value = item.analogPrice ?? null;
    btradeStockRow.getCell(col).value = item.btradeStock ?? null;
    btradePriceRow.getCell(col).value = item.btradePrice ?? null;
  });

  worksheet.mergeCells(startRow, 1, startRow + 3, 1);
  worksheet.mergeCells(startRow, 2, startRow + 3, 2);
  worksheet.mergeCells(startRow, 3, startRow + 3, 3);
  worksheet.mergeCells(startRow, 4, startRow + 3, 4);

  const mergedHeaderCells = [
    analogStockRow.getCell(1),
    analogStockRow.getCell(2),
    analogStockRow.getCell(3),
    analogStockRow.getCell(4),
  ];

  for (const cell of mergedHeaderCells) {
    const prevAlignment = cell.alignment ?? {};
    cell.alignment = {
      ...prevAlignment,
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  const metrics = [
    { row: analogStockRow, getVal: (item: AnalogBtradeCompareItem) => item.analogStock },
    { row: analogPriceRow, getVal: (item: AnalogBtradeCompareItem) => item.analogPrice },
    { row: btradeStockRow, getVal: (item: AnalogBtradeCompareItem) => item.btradeStock },
    { row: btradePriceRow, getVal: (item: AnalogBtradeCompareItem) => item.btradePrice },
  ] as const;

  for (const { row, getVal } of metrics) {
    const firstRaw = items.length > 0 ? getVal(items[0]!) : null;
    const lastRaw = items.length > 0 ? getVal(items[items.length - 1]!) : null;
    const firstVal =
      typeof firstRaw === "number" ? firstRaw : Number(firstRaw ?? NaN);
    const lastVal =
      typeof lastRaw === "number" ? lastRaw : Number(lastRaw ?? NaN);
    if (!Number.isFinite(firstVal) || !Number.isFinite(lastVal)) continue;

    const diff = lastVal - firstVal;
    row.getCell(diffCol).value = diff;

    const diffPctCell = row.getCell(diffPctCol);

    if (firstVal === 0) {
      diffPctCell.value = null;
      diffPctCell.fill = {
        ...(diffPctCell.fill ?? {}),
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC0CB" },
      };
      continue;
    }

    const rawPct = (diff / firstVal) * 100;
    const roundedPct = Math.round(rawPct * 100) / 100;
    diffPctCell.value = roundedPct;
  }

  if (items.length > 1) {
    const getFirstAndLastNumeric = (
      selector: (item: AnalogBtradeCompareItem) => number | null,
    ): { first: number; last: number } | null => {
      let first: number | null = null;
      let last: number | null = null;

      for (let i = 0; i < items.length && first === null; i++) {
        const raw = selector(items[i]!);
        const val = typeof raw === "number" ? raw : Number(raw ?? NaN);
        if (Number.isFinite(val)) first = val;
      }

      for (let i = items.length - 1; i >= 0 && last === null; i--) {
        const raw = selector(items[i]!);
        const val = typeof raw === "number" ? raw : Number(raw ?? NaN);
        if (Number.isFinite(val)) last = val;
      }

      if (first === null || last === null) return null;
      return { first, last };
    };

    const analogBounds = getFirstAndLastNumeric((item) => item.analogStock);
    const btradeBounds = getFirstAndLastNumeric((item) => item.btradeStock);

    if (analogBounds && btradeBounds) {
      const deltaAnalog = analogBounds.last - analogBounds.first;
      const deltaBtrade = btradeBounds.last - btradeBounds.first;

        if (Number.isFinite(deltaAnalog) && Number.isFinite(deltaBtrade)) {
        blockDeltas = { deltaAnalog, deltaBtrade };
        const diffPieces = deltaAnalog - deltaBtrade;
        const summaryDiffCell = analogStockRow.getCell(summaryDiffCol);
        summaryDiffCell.value = diffPieces;

        const diffPiecesNumeric =
          typeof diffPieces === "number"
            ? diffPieces
            : Number(diffPieces ?? NaN);
        if (Number.isFinite(diffPiecesNumeric) && diffPiecesNumeric !== 0) {
          summaryDiffCell.font = {
            ...(summaryDiffCell.font ?? {}),
            color:
              diffPiecesNumeric > 0
                ? { argb: "FF00AA00" }
                : { argb: "FFFF0000" },
          };
        }

        const summaryPctCell = analogStockRow.getCell(summaryDiffPctCol);

        if (deltaAnalog === 0) {
          // При нулевой динамике аналога формула (deltaBtrade/deltaAnalog - 1) не определена
          summaryPctCell.value = null;
          summaryPctCell.fill = {
            ...(summaryPctCell.fill ?? {}),
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFC0CB" },
          };
        } else {
          const rawSummaryPct = (deltaBtrade / deltaAnalog - 1) * 100;
          const roundedSummaryPct =
            Math.round(rawSummaryPct * 100) / 100;

          summaryPctCell.value = roundedSummaryPct / 100;
          summaryPctCell.numFmt = "0.00%";

          const pctNumeric =
            typeof roundedSummaryPct === "number"
              ? roundedSummaryPct
              : Number(roundedSummaryPct ?? NaN);
          if (Number.isFinite(pctNumeric) && pctNumeric !== 0) {
            summaryPctCell.font = {
              ...(summaryPctCell.font ?? {}),
              color:
                pctNumeric > 0
                  ? { argb: "FF00AA00" }
                  : { argb: "FFFF0000" },
            };
          }
        }

        worksheet.mergeCells(startRow, summaryDiffCol, startRow + 3, summaryDiffCol);
        worksheet.mergeCells(
          startRow,
          summaryDiffPctCol,
          startRow + 3,
          summaryDiffPctCol,
        );
      }
    }
  }

  for (let i = 1; i < items.length; i++) {
    const prevCell = analogStockRow.getCell(dataStartCol + i - 1);
    const currCell = analogStockRow.getCell(dataStartCol + i);

    const prevRaw = prevCell.value;
    const currRaw = currCell.value;

    const prevVal =
      typeof prevRaw === "number" ? prevRaw : Number(prevRaw ?? NaN);
    const currVal =
      typeof currRaw === "number" ? currRaw : Number(currRaw ?? NaN);

    if (!Number.isFinite(prevVal) || !Number.isFinite(currVal)) continue;
    if (currVal > prevVal) {
      currCell.font = {
        ...(currCell.font ?? {}),
        color: { argb: "FFFF0000" },
      };
    }
  }

  for (let i = 1; i < items.length; i++) {
    const prevCell = analogPriceRow.getCell(dataStartCol + i - 1);
    const currCell = analogPriceRow.getCell(dataStartCol + i);

    const prevRaw = prevCell.value;
    const currRaw = currCell.value;

    const prevVal =
      typeof prevRaw === "number" ? prevRaw : Number(prevRaw ?? NaN);
    const currVal =
      typeof currRaw === "number" ? currRaw : Number(currRaw ?? NaN);

    if (!Number.isFinite(prevVal) || !Number.isFinite(currVal)) continue;
    if (currVal < prevVal) {
      currCell.font = {
        ...(currCell.font ?? {}),
        color: { argb: "FF00AA00" },
      };
    }
  }

  for (let rowNumber = startRow; rowNumber <= startRow + 3; rowNumber++) {
    applyDataRowStyle(worksheet, rowNumber, columnCount);
  }

  const summaryValueCells = [
    analogStockRow.getCell(summaryDiffCol),
    analogStockRow.getCell(summaryDiffPctCol),
  ];
  for (const cell of summaryValueCells) {
    const prevAlignment = cell.alignment ?? {};
    cell.alignment = {
      ...prevAlignment,
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  return blockDeltas;
}

export interface BuildAnalogBtradeTotalBlockOptions {
  worksheet: ExcelJS.Worksheet;
  totalStartRow: number;
  diffCol: number;
  summaryDiffCol: number;
  summaryDiffPctCol: number;
  columnCount: number;
  sumDeltaAnalog: number;
  sumDeltaBtrade: number;
  competitorTitle?: string | null;
  producerName?: string | null;
}

export function buildAnalogBtradeTotalBlock(
  options: BuildAnalogBtradeTotalBlockOptions,
): void {
  const {
    worksheet,
    totalStartRow,
    diffCol,
    summaryDiffCol,
    summaryDiffPctCol,
    columnCount,
    sumDeltaAnalog,
    sumDeltaBtrade,
    competitorTitle,
    producerName,
  } = options;

  const row1 = worksheet.getRow(totalStartRow);
  const row2 = worksheet.getRow(totalStartRow + 1);

  worksheet.mergeCells(totalStartRow, 1, totalStartRow + 1, 1);
  const cellA = row1.getCell(1);
  cellA.value = "ВСЬОГО";
  cellA.font = { ...(cellA.font ?? {}), bold: true };
  cellA.alignment = { ...(cellA.alignment ?? {}), horizontal: "center", vertical: "middle" };

  const safeCompetitorTitle = competitorTitle ?? "";
  const safeProducerName = producerName ?? "";
  worksheet.mergeCells(totalStartRow, 3, totalStartRow + 1, 3);
  const cellC = row1.getCell(3);
  cellC.value = safeCompetitorTitle;
  cellC.font = { ...(cellC.font ?? {}), bold: true };
  cellC.alignment = { ...(cellC.alignment ?? {}), horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(totalStartRow, 4, totalStartRow + 1, 4);
  const cellD = row1.getCell(4);
  cellD.value = safeProducerName;
  cellD.font = { ...(cellD.font ?? {}), bold: true };
  cellD.alignment = { ...(cellD.alignment ?? {}), horizontal: "center", vertical: "middle" };

  const cellE1 = row1.getCell(5);
  cellE1.value = "Аналог";
  cellE1.font = { ...(cellE1.font ?? {}), bold: true };
  const cellE2 = row2.getCell(5);
  cellE2.value = "Btrade";
  cellE2.font = { ...(cellE2.font ?? {}), bold: true };

  const cellJ1 = row1.getCell(diffCol);
  cellJ1.value = sumDeltaAnalog;
  cellJ1.font = { ...(cellJ1.font ?? {}), bold: true };
  row2.getCell(diffCol).value = sumDeltaBtrade;
  row2.getCell(diffCol).font = { ...(row2.getCell(diffCol).font ?? {}), bold: true };

  worksheet.mergeCells(totalStartRow, summaryDiffCol, totalStartRow + 1, summaryDiffCol);
  const summaryDiff = sumDeltaAnalog - sumDeltaBtrade;
  const summaryDiffCell = row1.getCell(summaryDiffCol);
  summaryDiffCell.value = summaryDiff;
  summaryDiffCell.font = { ...(summaryDiffCell.font ?? {}), bold: true };
  if (summaryDiffCol + 1 < summaryDiffPctCol) {
    worksheet.mergeCells(totalStartRow, summaryDiffCol + 1, totalStartRow + 1, summaryDiffCol + 1);
  }
  worksheet.mergeCells(totalStartRow, summaryDiffPctCol, totalStartRow + 1, summaryDiffPctCol);
  const summaryDiffNumeric =
    typeof summaryDiff === "number" ? summaryDiff : Number(summaryDiff ?? NaN);
  if (Number.isFinite(summaryDiffNumeric) && summaryDiffNumeric !== 0) {
    summaryDiffCell.font = {
      ...(summaryDiffCell.font ?? {}),
      bold: true,
      color:
        summaryDiffNumeric > 0
          ? { argb: "FF00AA00" }
          : { argb: "FFFF0000" },
    };
  }

  const summaryPctCell = row1.getCell(summaryDiffPctCol);
  summaryPctCell.font = { ...(summaryPctCell.font ?? {}), bold: true };
  if (sumDeltaAnalog === 0) {
    summaryPctCell.value = null;
    summaryPctCell.fill = {
      ...(summaryPctCell.fill ?? {}),
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFC0CB" },
    };
  } else {
    const rawSummaryPct = (sumDeltaBtrade / sumDeltaAnalog - 1) * 100;
    const roundedSummaryPct = Math.round(rawSummaryPct * 100) / 100;
    summaryPctCell.value = roundedSummaryPct / 100;
    summaryPctCell.numFmt = "0.00%";
    const pctNumeric =
      typeof roundedSummaryPct === "number"
        ? roundedSummaryPct
        : Number(roundedSummaryPct ?? NaN);
    if (Number.isFinite(pctNumeric) && pctNumeric !== 0) {
      summaryPctCell.font = {
        ...(summaryPctCell.font ?? {}),
        bold: true,
        color:
          pctNumeric > 0 ? { argb: "FF00AA00" } : { argb: "FFFF0000" },
      };
    }
  }

  applyDataRowStyle(worksheet, totalStartRow, columnCount);
  applyDataRowStyle(worksheet, totalStartRow + 1, columnCount);

  for (let c = 1; c <= columnCount; c++) {
    row1.getCell(c).font = { ...(row1.getCell(c).font ?? {}), bold: true };
    row2.getCell(c).font = { ...(row2.getCell(c).font ?? {}), bold: true };
  }
}

