import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import { formatDateHeader } from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { loadKonkDisplayMetaByName } from "../../../../sku-reporting/utils/konkDisplayTitles.js";
import { loadProdDisplayTitlesByName } from "../../../../sku-reporting/utils/prodDisplayTitles.js";
import { resolveSkusByIds } from "../../../../sku-reporting/utils/resolveSkusByIds.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import {
  buildSkuSalesExcelForSkus,
  type SkuSalesExcelSkuRow,
} from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";
import type { GetSelectionSkuSalesExcelInput } from "../schemas/getSelectionSkuSalesExcelSchema.js";

export type GetSelectionSkuSalesExcelResult =
  { ok: true; buffer: Buffer; fileName: string } | { ok: false };

export async function getSelectionSkuSalesExcelUtil(
  input: GetSelectionSkuSalesExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetSelectionSkuSalesExcelResult> {
  const resolved = await resolveSkusByIds(input.skuIds);
  if (resolved.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);

  const maps = await loadExcelSliceMapsForSkus(
    resolved.map((r) => ({ konkName: r.konkName, productId: r.productId })),
    warmStart,
    dateTo,
  );

  const [konkMetaByName, prodTitleByName] = await Promise.all([
    loadKonkDisplayMetaByName(resolved.map((r) => r.konkName)),
    loadProdDisplayTitlesByName(resolved.map((r) => r.prodName)),
  ]);

  const recountDaysByKonk = new Map<string, ReadonlySet<string>>();
  for (const [name, meta] of konkMetaByName) {
    recountDaysByKonk.set(name, new Set(meta.recountDays));
  }

  const rows: SkuSalesExcelSkuRow[] = resolved.map((r) => ({
    title: r.title,
    url: r.url,
    productId: r.productId,
    konkName: r.konkName,
    competitorTitle: konkMetaByName.get(r.konkName)?.title ?? r.konkName,
    producerName: prodTitleByName.get(r.prodName) ?? r.prodName,
    skugrTitle: r.skugrTitle,
  }));

  const { buffer } = await buildSkuSalesExcelForSkus(
    rows,
    dateFrom,
    dateTo,
    (kn, pid, d) => getSliceItem(maps, kn, pid, d),
    {
      summaryMode: "bottomOnly",
      summarySalesLabel: "Загальні продажі, шт",
      summaryRevenueLabel: "Загальна виручка, грн",
      recountDaysByKonk,
      includeShareBlock: true,
      metrics: input.metrics,
      onProgress: progress.onProgress,
    },
  );

  const fileName = `sku_sales_selection_${resolved.length}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
