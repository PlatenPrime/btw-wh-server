import ExcelJS from "exceljs";
import type { AnalogBtradeCompareItem } from "./getAnalogBtradeComparisonRangeUtil.js";
import {
  buildAnalogBtradeExcelBlock,
  setupAnalogBtradeHeaderRow,
} from "../../common/buildAnalogBtradeExcelBlock.js";

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
    setupAnalogBtradeHeaderRow(
      worksheet,
      items,
      dataStartCol,
      diffCol,
      diffPctCol,
      summaryDiffCol,
      summaryDiffPctCol,
      columnCount,
    );

    buildAnalogBtradeExcelBlock({
      worksheet,
      startRow: 2,
      dataStartCol,
      diffCol,
      diffPctCol,
      summaryDiffCol,
      summaryDiffPctCol,
      columnCount,
      items,
      artikul: options.artikul,
      artNameUkr: options.artNameUkr,
      producerName: options.producerName,
      competitorTitle: options.competitorTitle,
    });

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

