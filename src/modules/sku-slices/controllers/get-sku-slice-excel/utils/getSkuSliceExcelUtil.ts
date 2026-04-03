import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForSingleProductId,
} from "../../../utils/sliceDataAggregationStages.js";
import {
  buildSkuSliceExcelForSkus,
  type SkuSliceExcelSkuRow,
} from "../../../utils/buildSkuSliceExcel.js";
import type { GetSkuSliceExcelInput } from "../schemas/getSkuSliceExcelSchema.js";

export type GetSkuSliceExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getSkuSliceExcelUtil(
  input: GetSkuSliceExcelInput
): Promise<GetSkuSliceExcelResult> {
  const sku = await Sku.findById(input.skuId).lean();
  if (!sku) return { ok: false };

  const productKey = sku.productId?.trim();
  if (!productKey) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const slices = await aggregateSkuSlices([
    {
      $match: {
        konkName: sku.konkName,
        date: { $gte: dateFrom, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForSingleProductId(productKey),
  ]);

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const sl of slices) {
    const t = toSliceDate(sl.date).getTime();
    byDate.set(t, (sl.data ?? {}) as Record<string, ISkuSliceDataItem>);
  }

  const row: SkuSliceExcelSkuRow = {
    title: sku.title,
    url: sku.url,
    productId: productKey,
    konkName: sku.konkName,
    prodName: sku.prodName,
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
    (kn, pid, d) => {
      if (kn !== sku.konkName || pid !== productKey) return undefined;
      const rec = byDate.get(toSliceDate(d).getTime());
      return rec?.[pid];
    },
    titles
  );

  return { ok: true, buffer, fileName };
}
