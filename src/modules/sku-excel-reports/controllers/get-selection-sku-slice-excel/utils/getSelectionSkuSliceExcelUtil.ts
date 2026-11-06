import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { loadSkuPreviewsIfRequested } from "../../../../../lib/excel/loadSkuPreviewsIfRequested.js";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  type SkuSliceExcelSkuRow,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { loadKonkDisplayMetaByName } from "../../../../sku-reporting/utils/konkDisplayTitles.js";
import { loadProdDisplayTitlesByName } from "../../../../sku-reporting/utils/prodDisplayTitles.js";
import { resolveSelectionSkus } from "../../../../sku-reporting/utils/resolveSelectionSkus.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetSelectionSkuSliceExcelInput } from "../schemas/getSelectionSkuSliceExcelSchema.js";

export type GetSelectionSkuSliceExcelResult =
  { ok: true; buffer: Buffer; fileName: string } | { ok: false };

export async function getSelectionSkuSliceExcelUtil(
  input: GetSelectionSkuSliceExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetSelectionSkuSliceExcelResult> {
  const resolved = await resolveSelectionSkus(
    input.selectAll === true
      ? {
          selectAll: true,
          search: input.search,
          konkName: input.konkName,
          prodName: input.prodName,
        }
      : { skuIds: input.skuIds! },
  );
  if (resolved.length === 0) return { ok: false };

  const includeImages = input.includeImages === true;
  const [konkMetaByName, prodTitleByName] = await Promise.all([
    loadKonkDisplayMetaByName(resolved.map((r) => r.konkName)),
    loadProdDisplayTitlesByName(resolved.map((r) => r.prodName)),
  ]);

  const rows: SkuSliceExcelSkuRow[] = resolved.map((r) => ({
    skuId: r._id.toString(),
    title: r.title,
    url: r.url,
    imageUrl: r.imageUrl,
    productId: r.productId,
    artikul: r.artikul,
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

  const previews = await loadSkuPreviewsIfRequested(
    includeImages,
    rows.map((r) => ({ skuId: r.skuId!, imageUrl: r.imageUrl ?? "" })),
    progress.onProgress,
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
      includeImages,
      previews,
      onProgress: progress.onProgress,
    },
  );

  const fileName = `sku_slice_selection_${resolved.length}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
