import ExcelJS from "exceljs";
import {
  applyDataRowStyle,
  applyHeaderStyle,
} from "../../../lib/excel/worksheetStyles.js";
import { formatExcelDateHeaderUk } from "../../../lib/excel/formatExcelDateHeaderUk.js";
import type { BtradeReportingCoalescedPoint } from "./coalesceBtradeSliceItemsForReporting.js";

const META_HEADERS = ["Артикул", "Назва (укр)", "Показник"] as const;
const STOCK_METRICS = ["Залишок", "Ціна"] as const;

export type BuildArtStockExcelInput = {
  artikul: string;
  artNameUkr: string | null;
  datesReport: Date[];
  coalescedReport: BtradeReportingCoalescedPoint[];
  dateFrom: Date;
  dateTo: Date;
};

export async function buildArtStockExcel(
  input: BuildArtStockExcelInput,
): Promise<{ buffer: Buffer; fileName: string }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Залишки");

  const headers = [
    ...META_HEADERS,
    ...input.datesReport.map((d) => formatExcelDateHeaderUk(d)),
  ];

  worksheet.addRow(headers);
  applyHeaderStyle(worksheet, headers.length);

  for (let m = 0; m < STOCK_METRICS.length; m++) {
    const rowValues: (string | number | null)[] = [
      input.artikul,
      input.artNameUkr ?? "",
      STOCK_METRICS[m]!,
    ];
    for (let i = 0; i < input.datesReport.length; i++) {
      const point = input.coalescedReport[i]!;
      if (m === 0) {
        rowValues.push(point.quantity);
      } else {
        rowValues.push(point.price);
      }
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
  const fileName = `art_stock_${safeArtikul}_${fromStr}_${toStr}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), fileName };
}
