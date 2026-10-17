import { Konk } from "../../../../konks/models/Konk.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import {
  formatDateHeader,
  safeFilePart,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { loadProdDisplayTitlesByName } from "../../../../sku-reporting/utils/prodDisplayTitles.js";
import { resolveKonkProdSkus } from "../../../../sku-reporting/utils/resolveKonkProdSkus.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetKonkSkuSalesExcelInput } from "../schemas/getKonkSkuSalesExcelSchema.js";
import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import {
  buildSkuSalesExcelForSkus,
  computeSkuSalesPeriodMetrics,
  type SkuSalesExcelSkuRow,
} from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";
import { sortSkuSalesExcelRowsByScore } from "../../get-sku-sales-excel/utils/sortSkuSalesExcelRowsByScore.js";

export type GetKonkSkuSalesExcelResult =
  { ok: true; buffer: Buffer; fileName: string } | { ok: false };

export async function getKonkSkuSalesExcelUtil(
  input: GetKonkSkuSalesExcelInput,
  progress: ExcelUtilProgressOptions = {},
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

  const maps = await loadExcelSliceMapsForSkus(
    resolved.map((r) => ({ konkName: r.konkName, productId: r.productId })),
    warmStart,
    dateTo,
  );

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

  const lookup = (kn: string, pid: string, d: Date) => getSliceItem(maps, kn, pid, d);

  let rowsOrdered: SkuSalesExcelSkuRow[] = rows;
  if (input.sortBy === "sales" || input.sortBy === "revenue") {
    const metric = input.sortBy;
    const scoreByProductId = new Map<string, number>();
    for (const row of rows) {
      const computed = computeSkuSalesPeriodMetrics(row, dateFrom, dateTo, lookup, recountDaysSet);
      scoreByProductId.set(
        row.productId,
        metric === "sales" ? computed.totalSales : computed.totalRevenue,
      );
    }
    rowsOrdered = sortSkuSalesExcelRowsByScore(
      rows,
      (row) => scoreByProductId.get(row.productId) ?? 0,
    );
  }

  const { buffer } = await buildSkuSalesExcelForSkus(rowsOrdered, dateFrom, dateTo, lookup, {
    summaryMode: "bottomOnly",
    summarySalesLabel: "Загальні продажі, шт",
    summaryRevenueLabel: "Загальна виручка, грн",
    recountDays,
    metrics: input.metrics,
    onProgress: progress.onProgress,
  });

  const fileName = `sku_sales_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
