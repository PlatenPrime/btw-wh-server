import { Konk } from "../../../../konks/models/Konk.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForProductIdList,
} from "../../../utils/sliceDataAggregationStages.js";
import {
  formatDateHeader,
  safeFilePart,
} from "../../../utils/buildSkuSliceExcel.js";
import { loadProdDisplayTitlesByName } from "../../../utils/prodDisplayTitles.js";
import { resolveKonkProdSkus } from "../../../utils/resolveKonkProdSkus.js";
import type { GetKonkSkuSalesExcelInput } from "../schemas/getKonkSkuSalesExcelSchema.js";
import {
  buildSkuSalesExcelForSkus,
  computeSkuSalesPeriodMetrics,
  type SkuSalesExcelSkuRow,
} from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";

export type GetKonkSkuSalesExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getKonkSkuSalesExcelUtil(
  input: GetKonkSkuSalesExcelInput
): Promise<GetKonkSkuSalesExcelResult> {
  const resolved = await resolveKonkProdSkus({
    konk: input.konk,
    prod: input.prod,
    skugrIds: input.skugrIds,
  });
  if (resolved.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);

  const allowedProductIds = resolved.map((r) => r.productId);
  const slices = await aggregateSkuSlices([
    {
      $match: {
        konkName: input.konk,
        date: { $gte: warmStart, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForProductIdList(allowedProductIds),
  ]);

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const sl of slices) {
    byDate.set(
      toSliceDate(sl.date).getTime(),
      (sl.data ?? {}) as Record<string, ISkuSliceDataItem>
    );
  }

  const [konkDoc, prodTitleByName] = await Promise.all([
    Konk.findOne({ name: input.konk }).select("title recountDays").lean(),
    loadProdDisplayTitlesByName(resolved.map((r) => r.prodName)),
  ]);
  const recountDays = (konkDoc?.recountDays ?? []).map(String);
  const recountDaysSet = new Set(recountDays);

  const competitorTitle = (konkDoc?.title ?? "").trim();
  const rows: SkuSalesExcelSkuRow[] = resolved.map((r) => ({
    title: r.title,
    url: r.url,
    productId: r.productId,
    konkName: r.konkName,
    competitorTitle,
    producerName: prodTitleByName.get(r.prodName) ?? r.prodName,
    skugrTitle: r.skugrTitle,
  }));

  const getSliceItem = (
    kn: string,
    pid: string,
    d: Date
  ): ISkuSliceDataItem | undefined => {
    if (kn !== input.konk) return undefined;
    const rec = byDate.get(toSliceDate(d).getTime());
    return rec?.[pid];
  };

  let rowsOrdered: SkuSalesExcelSkuRow[] = rows;
  if (input.sortBy === "sales") {
    rowsOrdered = [...rows].sort((a, b) => {
      const ta = computeSkuSalesPeriodMetrics(
        a,
        dateFrom,
        dateTo,
        getSliceItem,
        recountDaysSet,
      ).totalSales;
      const tb = computeSkuSalesPeriodMetrics(
        b,
        dateFrom,
        dateTo,
        getSliceItem,
        recountDaysSet,
      ).totalSales;
      if (tb !== ta) return tb - ta;
      return a.productId.localeCompare(b.productId);
    });
  } else if (input.sortBy === "revenue") {
    rowsOrdered = [...rows].sort((a, b) => {
      const ta = computeSkuSalesPeriodMetrics(
        a,
        dateFrom,
        dateTo,
        getSliceItem,
        recountDaysSet,
      ).totalRevenue;
      const tb = computeSkuSalesPeriodMetrics(
        b,
        dateFrom,
        dateTo,
        getSliceItem,
        recountDaysSet,
      ).totalRevenue;
      if (tb !== ta) return tb - ta;
      return a.productId.localeCompare(b.productId);
    });
  }

  const { buffer } = await buildSkuSalesExcelForSkus(
    rowsOrdered,
    dateFrom,
    dateTo,
    getSliceItem,
    {
      summaryMode: "bottomOnly",
      summarySalesLabel: "Загальні продажі, шт",
      summaryRevenueLabel: "Загальна виручка, грн",
      recountDays,
    }
  );

  const fileName = `sku_sales_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
