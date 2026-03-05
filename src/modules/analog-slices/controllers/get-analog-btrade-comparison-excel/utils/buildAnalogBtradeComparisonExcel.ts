import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../../../lib/excel/worksheetStyles.js";
import type { AnalogBtradeCompareItem } from "./getAnalogBtradeComparisonRangeUtil.js";

export interface BuildAnalogBtradeComparisonExcelOptions {
  artikul: string;
  artNameUkr: string | null;
  producerName?: string | null;
  competitorTitle?: string | null;
  dateFrom: Date;
  dateTo: Date;
}

/**
 * Створює Excel-файл для порівняння зрізів по аналогу та Btrade.
 * Перша строка: дати стовпців (YYYY-MM-DD).
 * Строки 2–5:
 *  - 2: залишок аналога (конкурент)
 *  - 3: ціна аналога (конкурент)
 *  - 4: залишок Btrade
 *  - 5: ціна Btrade
 */
export async function buildAnalogBtradeComparisonExcel(
  items: AnalogBtradeCompareItem[],
  options: BuildAnalogBtradeComparisonExcelOptions
): Promise<{ buffer: Buffer; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Порівняння");

  const dataStartCol = 6; // колонка F — первая дата (A–E — службові колонки)
  const diffCol = dataStartCol + items.length;
  const diffPctCol = diffCol + 1;
  const summaryDiffCol = diffPctCol + 1;
  const summaryDiffPctCol = summaryDiffCol + 1;
  const columnCount = items.length + 9;

  if (columnCount > 0) {
    const headerRow = worksheet.getRow(1);
    // Колонки A–D — дані артикулу та контрагентів, колонка E — підпис рядка, дати починаються з колонки F
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

    // Центруємо заголовки обобщающих колонок
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

    // Гарантируем, что последний заголовок имеет те же стили, что и предпоследний
    const refHeader = headerRow.getCell(summaryDiffCol);
    const pctHeader = headerRow.getCell(summaryDiffPctCol);
    pctHeader.font = refHeader.font;
    pctHeader.fill = refHeader.fill;
    pctHeader.border = refHeader.border;
    pctHeader.alignment = refHeader.alignment;

    const analogStockRow = worksheet.getRow(2);
    const analogPriceRow = worksheet.getRow(3);
    const btradeStockRow = worksheet.getRow(4);
    const btradePriceRow = worksheet.getRow(5);

    const artName = options.artNameUkr ?? "";
    const producerName = options.producerName ?? "";
    const competitorTitle = options.competitorTitle ?? "";

    // A–D заполняем только в первой строке блока (ряд 2)
    analogStockRow.getCell(1).value = options.artikul;
    analogStockRow.getCell(2).value = artName;
    analogStockRow.getCell(3).value = competitorTitle;
    analogStockRow.getCell(4).value = producerName;

    // Строки 3–5 в колонках A–D оставляем пустыми

    // Подписи рядков у колонці E
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

    // Объединяем перші чотири колонки (A–D) по строках 2–5
    worksheet.mergeCells(2, 1, 5, 1);
    worksheet.mergeCells(2, 2, 5, 2);
    worksheet.mergeCells(2, 3, 5, 3);
    worksheet.mergeCells(2, 4, 5, 4);

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

    // Колонки «Різниця» та «Різниця, %» для кожного рядка даних
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

      if (firstVal === 0) {
        row.getCell(diffPctCol).value = null;
        continue;
      }

      const rawPct = (diff / firstVal) * 100;
      const roundedPct = Math.round(rawPct * 100) / 100;
      row.getCell(diffPctCol).value = roundedPct;
    }

    // Обобщающая разница динамики остатков Btrade vs конкурент
    if (items.length > 1) {
      const getFirstAndLastNumeric = (
        selector: (item: AnalogBtradeCompareItem) => number | null
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

      const analogBounds = getFirstAndLastNumeric(
        (item) => item.analogStock
      );
      const btradeBounds = getFirstAndLastNumeric(
        (item) => item.btradeStock
      );

      if (analogBounds && btradeBounds) {
        const deltaAnalog = analogBounds.last - analogBounds.first;
        const deltaBtrade = btradeBounds.last - btradeBounds.first;

        if (Number.isFinite(deltaAnalog) && Number.isFinite(deltaBtrade)) {
          const diffPieces = deltaAnalog - deltaBtrade;
          analogStockRow.getCell(summaryDiffCol).value = diffPieces;

          if (deltaBtrade === 0) {
            analogStockRow.getCell(summaryDiffPctCol).value = null;
          } else {
            const rawSummaryPct =
              (diffPieces / Math.abs(deltaBtrade)) * 100;
            const roundedSummaryPct =
              Math.round(rawSummaryPct * 100) / 100;
            analogStockRow.getCell(summaryDiffPctCol).value =
              roundedSummaryPct;
          }

          // объединяем ячейки по строкам 2–5 для обобщающих колонок
          worksheet.mergeCells(2, summaryDiffCol, 5, summaryDiffCol);
          worksheet.mergeCells(2, summaryDiffPctCol, 5, summaryDiffPctCol);
        }
      }
    }

    // Условное форматирование: остатки аналога (красный при росте)
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
          color: { argb: "FFFF0000" }, // красный
        };
      }
    }

    // Условное форматирование: цены аналога (зелёный при снижении)
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
          color: { argb: "FF00AA00" }, // зелёный
        };
      }
    }

    for (let rowNumber = 2; rowNumber <= 5; rowNumber++) {
      applyDataRowStyle(worksheet, rowNumber, columnCount);
    }

    // Центруємо значення в обобщающих колонках (верхние ячейки мердж-диапазонов)
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

    for (let c = 1; c <= columnCount; c++) {
      worksheet.getColumn(c).width = 14;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const safeArtikul = options.artikul.replace(/\s+/g, "_");
  const fromStr = options.dateFrom.toISOString().split("T")[0] ?? "from";
  const toStr = options.dateTo.toISOString().split("T")[0] ?? "to";
  const fileName = `analog_btrade_comparison_${safeArtikul}_${fromStr}_${toStr}.xlsx`;

  return { buffer: Buffer.from(buffer), fileName };
}

