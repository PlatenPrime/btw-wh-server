import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
  type SkuSliceExcelSkuRow,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { loadProdDisplayTitlesByName } from "../../../../sku-reporting/utils/prodDisplayTitles.js";
import { resolveKonkProdSkus } from "../../../../sku-reporting/utils/resolveKonkProdSkus.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetKonkSkuSliceExcelInput } from "../schemas/getKonkSkuSliceExcelSchema.js";

export type GetKonkSkuSliceExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getKonkSkuSliceExcelUtil(
  input: GetKonkSkuSliceExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetKonkSkuSliceExcelResult> {
  const resolved = await resolveKonkProdSkus({
    konk: input.konk,
    prod: input.prod,
    skugrIds: input.skugrIds,
  });
  if (resolved.length === 0) return { ok: false };

  const prodTitleByName = await loadProdDisplayTitlesByName(
    resolved.map((r) => r.prodName),
  );

  const rows: SkuSliceExcelSkuRow[] = resolved.map((r) => ({
    title: r.title,
    url: r.url,
    productId: r.productId,
    konkName: r.konkName,
    prodName: r.prodName,
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

  const konkDoc = await Konk.findOne({ name: input.konk }).select("title").lean();
  const titles = {
    competitorTitle: (konkDoc?.title ?? "").trim(),
    producerName: "",
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
      onProgress: progress.onProgress,
    },
  );

  const fileName = `sku_slice_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;

  return { ok: true, buffer, fileName };
}
