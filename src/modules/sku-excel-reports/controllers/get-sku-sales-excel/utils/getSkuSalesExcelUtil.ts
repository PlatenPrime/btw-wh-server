import type { ExcelUtilProgressOptions } from "../../../../../lib/excel/excelBuildProgress.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import {
  formatDateHeader,
  safeFilePart,
} from "../../../../sku-reporting/utils/buildSkuSliceExcel.js";
import { getSliceItem } from "../../../../sku-reporting/utils/skugrReporting.js";
import { loadExcelSliceMapsForSkus } from "../../../utils/loadExcelSliceMapsForSkus.js";
import type { GetSkuSalesExcelInput } from "../schemas/getSkuSalesExcelSchema.js";
import {
  buildSkuSalesExcelForSkus,
  type SkuSalesExcelSkuRow,
} from "./buildSkuSalesExcel.js";

export type GetSkuSalesExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getSkuSalesExcelUtil(
  input: GetSkuSalesExcelInput,
  progress: ExcelUtilProgressOptions = {},
): Promise<GetSkuSalesExcelResult> {
  const sku = await Sku.findById(input.skuId).lean();
  if (!sku) return { ok: false };

  const productKey = sku.productId?.trim();
  if (!productKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);

  const maps = await loadExcelSliceMapsForSkus(
    [{ konkName: sku.konkName, productId: productKey }],
    warmStart,
    dateTo,
  );

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: sku.konkName }).select("title recountDays").lean(),
    Prod.findOne({ name: sku.prodName }).select("title").lean(),
  ]);

  const row: SkuSalesExcelSkuRow = {
    title: sku.title,
    url: sku.url,
    productId: productKey,
    konkName: sku.konkName,
    competitorTitle: (konkDoc?.title ?? "").trim(),
    producerName: (prodDoc?.title ?? "").trim(),
  };

  const { buffer } = await buildSkuSalesExcelForSkus(
    [row],
    dateFrom,
    dateTo,
    (kn, pid, d) => getSliceItem(maps, kn, pid, d),
    {
      summaryMode: "perSku",
      recountDays: (konkDoc?.recountDays ?? []).map(String),
      onProgress: progress.onProgress,
    },
  );

  const fileName = `sku_sales_${safeFilePart(productKey)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
