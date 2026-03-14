import ExcelJS from "exceljs";
import {
  buildSalesComparisonExcelBlock,
  buildSalesComparisonSummaryBlock,
  setupSalesComparisonHeaderRow,
} from "../../common/buildSalesComparisonExcelBlock.js";
import type { AnalogBtradeCompareItem } from "../../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";

export interface BuildAnalogSalesComparisonExcelOptions {
  artikul: string;
  artNameUkr: string | null;
  artAbc?: string | null;
  producerName?: string | null;
  competitorTitle?: string | null;
  dateFrom: Date;
  dateTo: Date;
}

/**
 * Создаёт Excel-файл сравнения продаж по одному аналогу и Btrade.
 * 6 строк: продажи/ціна/виручка аналога и Btrade по датам, колонка «Всього», 4 колонки дельт, итог ключ–значение.
 */
export async function buildAnalogSalesComparisonExcel(
  items: AnalogBtradeCompareItem[],
  options: BuildAnalogSalesComparisonExcelOptions,
): Promise<{ buffer: Buffer; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Порівняння");

  const dataStartCol = 7;
  const totalCol = dataStartCol + items.length;
  const diffSalesCol = totalCol + 1;
  const diffSalesPctCol = totalCol + 2;
  const diffRevenueCol = totalCol + 3;
  const diffRevenuePctCol = totalCol + 4;
  const columnCount = diffRevenuePctCol;

  if (columnCount > 0 && items.length > 0) {
    setupSalesComparisonHeaderRow({
      worksheet,
      items,
      dataStartCol,
      totalCol,
      diffSalesCol,
      diffSalesPctCol,
      diffRevenueCol,
      diffRevenuePctCol,
      columnCount,
    });

    const totals = buildSalesComparisonExcelBlock({
      worksheet,
      startRow: 2,
      dataStartCol,
      totalCol,
      diffSalesCol,
      diffSalesPctCol,
      diffRevenueCol,
      diffRevenuePctCol,
      columnCount,
      items,
      artikul: options.artikul,
      artNameUkr: options.artNameUkr,
      artAbc: options.artAbc,
      producerName: options.producerName,
      competitorTitle: options.competitorTitle,
    });

    const summaryStartRow = 9;
    buildSalesComparisonSummaryBlock({
      worksheet,
      startRow: summaryStartRow,
      keyCol: 1,
      valueCol: 2,
      totalAnalogSales: totals.totalAnalogSales,
      totalAnalogRevenue: totals.totalAnalogRevenue,
      totalBtradeSales: totals.totalBtradeSales,
      totalBtradeRevenue: totals.totalBtradeRevenue,
    });

    for (let c = 1; c <= columnCount; c++) {
      worksheet.getColumn(c).width = 14;
    }
  }

  const safeArtikul = options.artikul.replace(/\s+/g, "_");
  const fromStr = options.dateFrom.toISOString().split("T")[0] ?? "from";
  const toStr = options.dateTo.toISOString().split("T")[0] ?? "to";
  const fileName = `analog_sales_comparison_${safeArtikul}_${fromStr}_${toStr}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), fileName };
}
