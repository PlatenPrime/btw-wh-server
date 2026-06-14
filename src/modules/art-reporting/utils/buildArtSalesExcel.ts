import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../lib/excel/worksheetStyles.js";
import { formatExcelDateHeaderUk } from "../../../lib/excel/formatExcelDateHeaderUk.js";
import {
  computeArtSalesPointsFromSeries,
  type ArtBtradeSalesPoint,
} from "./loadArtBtradeSliceSeries.js";
import type { BtradeReportingCoalescedPoint } from "./coalesceBtradeSliceItemsForReporting.js";

const META_HEADERS = ["Артикул", "Назва (укр)", "Показник"] as const;
const SALES_METRICS = ["Продажі", "Ціна", "Виручка"] as const;

export type BuildArtSalesExcelInput = {
  artikul: string;
  artNameUkr: string | null;
  datesReport: Date[];
  coalescedReport: BtradeReportingCoalescedPoint[];
  coalescedFull: BtradeReportingCoalescedPoint[];
  reportIndexStart: number;
  dateFrom: Date;
  dateTo: Date;
};

function salesPointValue(
  point: ArtBtradeSalesPoint,
  metricIndex: number,
): number | null {
  if (metricIndex === 0) return point.sales;
  if (metricIndex === 1) return point.price;
  return point.revenue;
}

export async function buildArtSalesExcel(
  input: BuildArtSalesExcelInput,
): Promise<{ buffer: Buffer; fileName: string }> {
  const salesPoints = computeArtSalesPointsFromSeries(
    input.datesReport,
    input.coalescedFull,
    input.reportIndexStart,
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Продажі");

  const headers = [
    ...META_HEADERS,
    ...input.datesReport.map((d) => formatExcelDateHeaderUk(d)),
  ];

  worksheet.addRow(headers);
  applyHeaderStyle(worksheet, headers.length);

  for (let m = 0; m < SALES_METRICS.length; m++) {
    const rowValues: (string | number | null)[] = [
      input.artikul,
      input.artNameUkr ?? "",
      SALES_METRICS[m]!,
    ];
    for (let i = 0; i < salesPoints.length; i++) {
      rowValues.push(salesPointValue(salesPoints[i]!, m));
    }
    const row = worksheet.addRow(rowValues);
    applyDataRowStyle(worksheet, row.number, headers.length);
  }

  for (let c = 1; c <= headers.length; c++) {
    worksheet.getColumn(c).width = 16;
  }

  const safeArtikul = input.artikul.replace(/\s+/g, "_");
  const fromStr = input.dateFrom.toISOString().split("T")[0] ?? "from";
  const toStr = input.dateTo.toISOString().split("T")[0] ?? "to";
  const fileName = `art_sales_${safeArtikul}_${fromStr}_${toStr}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), fileName };
}
