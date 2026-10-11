import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
  type SkuSliceExcelSkuRow,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import {
  getSliceItem,
  loadSkugrWithOrderedSkus,
} from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetSkugrSliceExcelInput } from "../schemas/getSkugrSliceExcelSchema.js";

export type GetSkugrSliceExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getSkugrSliceExcelUtil(
  input: GetSkugrSliceExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetSkugrSliceExcelResult> {
  const loaded = await loadSkugrWithOrderedSkus(input.skugrId);
  if (!loaded) return { ok: false };
  const { skugr, skus } = loaded;
  if (skus.length === 0) return { ok: false };

  const rows: SkuSliceExcelSkuRow[] = skus.map((s) => ({
    title: s.title,
    url: s.url,
    productId: s.productId,
    konkName: s.konkName,
    prodName: s.prodName,
    skugrTitle: skugr.title,
    createdAt: s.createdAt,
  }));

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const maps = await loadExcelSliceMapsForSkus(
    skus.map((s) => ({ konkName: s.konkName, productId: s.productId })),
    dateFrom,
    dateTo,
  );

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: skugr.konkName }).select("title").lean(),
    Prod.findOne({ name: skugr.prodName }).select("title").lean(),
  ]);
  const titles = {
    competitorTitle: (konkDoc?.title ?? "").trim(),
    producerName: (prodDoc?.title ?? "").trim(),
  };

  const { buffer } = await buildSkuSliceExcelForSkus(
    rows,
    dateFrom,
    dateTo,
    (kn, pid, d) => getSliceItem(maps, kn, pid, d),
    titles,
    {
      includeTotalsRow: true,
      totalsRowLabel: "Підсумок",
      metrics: input.metrics,
      onProgress: progress.onProgress,
    },
  );

  const idPart = safeFilePart(skugr._id.toString());
  const fileName = `sku_slice_skugr_${idPart}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;

  return { ok: true, buffer, fileName };
}
