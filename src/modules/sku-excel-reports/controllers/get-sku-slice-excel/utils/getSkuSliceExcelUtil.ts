import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  buildSkuSliceExcelForSkus,
  type SkuSliceExcelSkuRow,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetSkuSliceExcelInput } from "../schemas/getSkuSliceExcelSchema.js";

export type GetSkuSliceExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getSkuSliceExcelUtil(
  input: GetSkuSliceExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetSkuSliceExcelResult> {
  const sku = await Sku.findById(input.skuId).lean();
  if (!sku) return { ok: false };

  const productKey = sku.productId?.trim();
  if (!productKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const maps = await loadExcelSliceMapsForSkus(
    [{ konkName: sku.konkName, productId: productKey }],
    dateFrom,
    dateTo,
  );

  const row: SkuSliceExcelSkuRow = {
    title: sku.title,
    url: sku.url,
    productId: productKey,
    konkName: sku.konkName,
    prodName: sku.prodName,
    createdAt: sku.createdAt,
  };

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: sku.konkName }).select("title").lean(),
    Prod.findOne({ name: sku.prodName }).select("title").lean(),
  ]);
  const titles = {
    competitorTitle: (konkDoc?.title ?? "").trim(),
    producerName: (prodDoc?.title ?? "").trim(),
  };

  const { buffer, fileName } = await buildSkuSliceExcelForSkus(
    [row],
    dateFrom,
    dateTo,
    (kn, pid, d) => getSliceItem(maps, kn, pid, d),
    titles,
    { metrics: input.metrics, onProgress: progress.onProgress },
  );

  return { ok: true, buffer, fileName };
}
