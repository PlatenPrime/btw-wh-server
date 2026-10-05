import { toSliceDate } from "../../../utils/sliceDate.js";
import { BtradeManufacturerDaySales } from "../models/BtradeManufacturerDaySales.js";
import { enumerateReportingDates } from "./skugrReporting.js";

export type BtradeManufacturerDailySalesRow = {
  date: Date;
  salesPcs: number;
  salesUah: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeProdName(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Периодная сумма Btrade sales по одному или нескольким prodName (уже lowercased).
 */
export async function sumBtradeManufacturerSalesForPeriod(params: {
  dateFrom: Date;
  dateTo: Date;
  /** Lowercased trimmed prod names. Empty → no match. */
  prodNamesLower: string[];
}): Promise<{ salesPcs: number; salesUah: number } | null> {
  const dateFrom = toSliceDate(params.dateFrom);
  const dateTo = toSliceDate(params.dateTo);
  const prodNames = [
    ...new Set(
      params.prodNamesLower.map(normalizeProdName).filter((s) => s.length > 0),
    ),
  ];
  if (prodNames.length === 0) return null;

  const rows = await BtradeManufacturerDaySales.aggregate<{
    salesPcs: number;
    salesUah: number;
  }>([
    {
      $match: {
        date: { $gte: dateFrom, $lte: dateTo },
        prodName: { $in: prodNames },
      },
    },
    {
      $group: {
        _id: null,
        salesPcs: { $sum: "$salesPcs" },
        salesUah: { $sum: "$salesUah" },
      },
    },
  ])
    .option({ allowDiskUse: true })
    .exec();

  const total = rows[0];
  if (!total) return { salesPcs: 0, salesUah: 0 };
  return {
    salesPcs: total.salesPcs,
    salesUah: round2(total.salesUah),
  };
}

/**
 * Дневные Btrade sales: один prod, список prod, или `"all"`.
 */
export async function dailyBtradeManufacturerSales(params: {
  dateFrom: Date;
  dateTo: Date;
  /** Exact prod, lowercased list, or `"all"`. */
  prodName?: string;
  prodNamesLower?: string[];
}): Promise<BtradeManufacturerDailySalesRow[]> {
  const dateFrom = toSliceDate(params.dateFrom);
  const dateTo = toSliceDate(params.dateTo);
  const dates = enumerateReportingDates(dateFrom, dateTo);
  if (dates.length === 0) return [];

  const match: Record<string, unknown> = {
    date: { $gte: dateFrom, $lte: dateTo },
  };

  const isAll = params.prodName?.trim() === "all";
  if (!isAll) {
    const names =
      params.prodNamesLower?.map(normalizeProdName).filter((s) => s.length > 0) ??
      (params.prodName ? [normalizeProdName(params.prodName)] : []);
    const unique = [...new Set(names)];
    if (unique.length === 0) {
      return dates.map((d) => ({ date: d, salesPcs: 0, salesUah: 0 }));
    }
    match.prodName = { $in: unique };
  }

  const rows = await BtradeManufacturerDaySales.aggregate<{
    _id: Date;
    salesPcs: number;
    salesUah: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: "$date",
        salesPcs: { $sum: "$salesPcs" },
        salesUah: { $sum: "$salesUah" },
      },
    },
  ])
    .option({ allowDiskUse: true })
    .exec();

  const byTime = new Map<number, { salesPcs: number; salesUah: number }>();
  for (const row of rows) {
    byTime.set(toSliceDate(row._id).getTime(), {
      salesPcs: row.salesPcs,
      salesUah: round2(row.salesUah),
    });
  }

  return dates.map((d) => {
    const row = byTime.get(toSliceDate(d).getTime());
    return {
      date: d,
      salesPcs: row?.salesPcs ?? 0,
      salesUah: row?.salesUah ?? 0,
    };
  });
}
