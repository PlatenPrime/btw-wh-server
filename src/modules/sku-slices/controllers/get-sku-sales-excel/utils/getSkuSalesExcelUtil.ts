import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  formatDateHeader,
  safeFilePart,
} from "../../../utils/buildSkuSliceExcel.js";
import type { GetSkuSalesExcelInput } from "../schemas/getSkuSalesExcelSchema.js";
import {
  buildSkuSalesExcelForSkus,
  type SkuSalesExcelSkuRow,
} from "./buildSkuSalesExcel.js";

export type GetSkuSalesExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getSkuSalesExcelUtil(
  input: GetSkuSalesExcelInput
): Promise<GetSkuSalesExcelResult> {
  const sku = await Sku.findById(input.skuId).lean();
  if (!sku) return { ok: false };

  const productKey = sku.productId?.trim();
  if (!productKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const slices = await SkuSlice.find({
    konkName: sku.konkName,
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .lean();

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const sl of slices) {
    byDate.set(
      toSliceDate(sl.date).getTime(),
      (sl.data ?? {}) as Record<string, ISkuSliceDataItem>
    );
  }

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: sku.konkName }).select("title").lean(),
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
    (kn, pid, d) => {
      if (kn !== sku.konkName || pid !== productKey) return undefined;
      const rec = byDate.get(toSliceDate(d).getTime());
      return rec?.[pid];
    },
    { summaryMode: "perSku" }
  );

  const fileName = `sku_sales_${safeFilePart(productKey)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
