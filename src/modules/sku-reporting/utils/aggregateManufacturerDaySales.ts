import { toSliceDate } from "../../../utils/sliceDate.js";
import { SkuManufacturerDaySales } from "../models/SkuManufacturerDaySales.js";
import { enumerateReportingDates } from "./skugrReporting.js";

export type ManufacturerSalesByKeyRow = {
  key: string;
  salesPcs: number;
  salesUah: number;
};

export type ManufacturerDailySalesRow = {
  date: Date;
  salesPcs: number;
  salesUah: number;
};

type AggKeyRow = {
  _id: string;
  salesPcs: number;
  salesUah: number;
};

type AggDateRow = {
  _id: Date;
  salesPcs: number;
  salesUah: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Период × prodName для одного konk (manufacturers-pie).
 */
export async function sumManufacturerSalesByProdName(params: {
  konkName: string;
  dateFrom: Date;
  dateTo: Date;
  prodNames?: string[];
}): Promise<ManufacturerSalesByKeyRow[]> {
  const dateFrom = toSliceDate(params.dateFrom);
  const dateTo = toSliceDate(params.dateTo);
  const match: Record<string, unknown> = {
    konkName: params.konkName,
    date: { $gte: dateFrom, $lte: dateTo },
  };
  if (params.prodNames?.length) {
    match.prodName = { $in: params.prodNames };
  }

  const rows = await SkuManufacturerDaySales.aggregate<AggKeyRow>([
    { $match: match },
    {
      $group: {
        _id: "$prodName",
        salesPcs: { $sum: "$salesPcs" },
        salesUah: { $sum: "$salesUah" },
      },
    },
  ])
    .option({ allowDiskUse: true })
    .exec();

  return rows
    .filter((r) => typeof r._id === "string" && r._id.length > 0)
    .map((r) => ({
      key: r._id,
      salesPcs: r.salesPcs,
      salesUah: round2(r.salesUah),
    }));
}

/**
 * Период × konkName для одного prod (prod-konks-pie competitor).
 * prodName сравнивается case-insensitive.
 */
export async function sumManufacturerSalesByKonkName(params: {
  prodName: string;
  dateFrom: Date;
  dateTo: Date;
  konkNames?: string[];
}): Promise<ManufacturerSalesByKeyRow[]> {
  const dateFrom = toSliceDate(params.dateFrom);
  const dateTo = toSliceDate(params.dateTo);
  const prodLower = params.prodName.trim().toLowerCase();
  if (!prodLower) return [];

  const match: Record<string, unknown> = {
    date: { $gte: dateFrom, $lte: dateTo },
    $expr: { $eq: [{ $toLower: "$prodName" }, prodLower] },
  };
  if (params.konkNames?.length) {
    match.konkName = { $in: params.konkNames };
  }

  const rows = await SkuManufacturerDaySales.aggregate<AggKeyRow>([
    { $match: match },
    {
      $group: {
        _id: "$konkName",
        salesPcs: { $sum: "$salesPcs" },
        salesUah: { $sum: "$salesUah" },
      },
    },
  ])
    .option({ allowDiskUse: true })
    .exec();

  return rows
    .filter((r) => typeof r._id === "string" && r._id.length > 0)
    .map((r) => ({
      key: r._id,
      salesPcs: r.salesPcs,
      salesUah: round2(r.salesUah),
    }));
}

/**
 * Дневные sales/revenue одного konk: конкретный prodName или сумма всех (`prodName === "all"`).
 * Пропуски дат заполняются нулями. prodName — case-insensitive.
 */
export async function dailyManufacturerSales(params: {
  konkName: string;
  /** Exact Prod.name, or `"all"` to sum all manufacturers of the konk. */
  prodName: string;
  dateFrom: Date;
  dateTo: Date;
}): Promise<ManufacturerDailySalesRow[]> {
  const dateFrom = toSliceDate(params.dateFrom);
  const dateTo = toSliceDate(params.dateTo);
  const dates = enumerateReportingDates(dateFrom, dateTo);
  if (dates.length === 0) return [];

  const isAll = params.prodName.trim() === "all";
  const match: Record<string, unknown> = {
    konkName: params.konkName,
    date: { $gte: dateFrom, $lte: dateTo },
  };
  if (!isAll) {
    const prodLower = params.prodName.trim().toLowerCase();
    if (!prodLower) {
      return dates.map((d) => ({ date: d, salesPcs: 0, salesUah: 0 }));
    }
    match.$expr = { $eq: [{ $toLower: "$prodName" }, prodLower] };
  }

  const rows = await SkuManufacturerDaySales.aggregate<AggDateRow>([
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

  const byTime = new Map<number, AggDateRow>();
  for (const row of rows) {
    byTime.set(toSliceDate(row._id).getTime(), row);
  }

  return dates.map((d) => {
    const row = byTime.get(toSliceDate(d).getTime());
    return {
      date: d,
      salesPcs: row?.salesPcs ?? 0,
      salesUah: round2(row?.salesUah ?? 0),
    };
  });
}
