import ExcelJS from "exceljs";
import type { ISkuSliceDataItem } from "../models/SkuSlice.js";

const META_HEADERS = [
  "Назва",
  "Посилання",
  "Ідентифікатор товару",
  "Конкурент",
  "Виробник",
] as const;

export function formatDateHeader(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function enumerateSliceDates(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    out.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
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
};

/**
 * Таблица: метаданные SKU + колонки по датам (залишок, ціна), блоками по 2 строки на SKU.
 */
export async function buildSkuSliceExcelForSkus(
  skus: SkuSliceExcelSkuRow[],
  dateFrom: Date,
  dateTo: Date,
  getItem: (
    konkName: string,
    productId: string,
    sliceDate: Date
  ) => ISkuSliceDataItem | null | undefined
): Promise<{ buffer: Buffer; fileName: string }> {
  const dates = enumerateSliceDates(dateFrom, dateTo);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Срез");

  const header = sheet.addRow([
    ...META_HEADERS,
    ...dates.map((d) => formatDateHeader(d)),
  ]);
  header.font = { bold: true };

  for (let s = 0; s < skus.length; s++) {
    const sku = skus[s]!;
    const stocks: (number | string)[] = [];
    const prices: (number | string)[] = [];
    for (const d of dates) {
      const item = getItem(sku.konkName, sku.productId, d);
      stocks.push(item != null ? item.stock : "");
      prices.push(item != null ? item.price : "");
    }
    sheet.addRow([
      sku.title,
      sku.url,
      sku.productId,
      sku.konkName,
      sku.prodName,
      ...stocks,
    ]);
    sheet.addRow(["", "", "", "", "", ...prices]);
    if (s < skus.length - 1) {
      sheet.addRow([]);
    }
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
