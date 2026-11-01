import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  type SkuSliceExcelSkuRow,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { loadKonkDisplayMetaByName } from "../../../../sku-reporting/utils/konkDisplayTitles.js";
import { loadProdDisplayTitlesByName } from "../../../../sku-reporting/utils/prodDisplayTitles.js";
import { resolveSkusByIds } from "../../../../sku-reporting/utils/resolveSkusByIds.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetSelectionSkuSliceExcelInput } from "../schemas/getSelectionSkuSliceExcelSchema.js";

export type GetSelectionSkuSliceExcelResult =
  { ok: true; buffer: Buffer; fileName: string } | { ok: false };

export async function getSelectionSkuSliceExcelUtil(
  input: GetSelectionSkuSliceExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetSelectionSkuSliceExcelResult> {
  const resolved = await resolveSkusByIds(input.skuIds);
  if (resolved.length === 0) return { ok: false };

  const [konkMetaByName, prodTitleByName] = await Promise.all([
    loadKonkDisplayMetaByName(resolved.map((r) => r.konkName)),
    loadProdDisplayTitlesByName(resolved.map((r) => r.prodName)),
  ]);

  const rows: SkuSliceExcelSkuRow[] = resolved.map((r) => ({
    title: r.title,
    url: r.url,
    productId: r.productId,
    konkName: r.konkName,
    prodName: r.prodName,
    competitorTitle: konkMetaByName.get(r.konkName)?.title ?? r.konkName,
    producerName: prodTitleByName.get(r.prodName) ?? r.prodName,
    skugrTitle: r.skugrTitle,
    createdAt: r.createdAt,
  }));

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const maps = await loadExcelSliceMapsForSkus(
    resolved.map((r) => ({ konkName: r.konkName, productId: r.productId })),
    dateFrom,
    dateTo,
  );

  const { buffer } = await buildSkuSliceExcelForSkus(
    rows,
    dateFrom,
    dateTo,
    (kn, pid, d) => getSliceItem(maps, kn, pid, d),
    { competitorTitle: "", producerName: "" },
    {
      includeTotalsRow: true,
      totalsRowLabel: "Підсумок",
      metrics: input.metrics,
      onProgress: progress.onProgress,
    },
  );

  const fileName = `sku_slice_selection_${resolved.length}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
