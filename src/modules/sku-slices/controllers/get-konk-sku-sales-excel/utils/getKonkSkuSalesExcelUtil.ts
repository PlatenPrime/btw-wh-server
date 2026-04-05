import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForProductIdList,
} from "../../../utils/sliceDataAggregationStages.js";
import {
  formatDateHeader,
  safeFilePart,
} from "../../../utils/buildSkuSliceExcel.js";
import type { GetKonkSkuSalesExcelInput } from "../schemas/getKonkSkuSalesExcelSchema.js";
import {
  buildSkuSalesExcelForSkus,
  type SkuSalesExcelSkuRow,
} from "../../get-sku-sales-excel/utils/buildSkuSalesExcel.js";

export type GetKonkSkuSalesExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getKonkSkuSalesExcelUtil(
  input: GetKonkSkuSalesExcelInput
): Promise<GetKonkSkuSalesExcelResult> {
  const skus = await Sku.find({
    konkName: input.konk,
    prodName: input.prod,
  })
    .sort({ productId: 1 })
    .lean();
  if (skus.length === 0) return { ok: false };

  const rowsBase = skus
    .map((sku) => ({
      title: sku.title,
      url: sku.url,
      productId: (sku.productId ?? "").trim(),
      konkName: sku.konkName,
      prodName: sku.prodName,
    }))
    .filter((row) => row.productId !== "");
  if (rowsBase.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const warmStart = sliceDateMinusDays(dateFrom, 1);

  const allowedProductIds = rowsBase.map((r) => r.productId);
  const slices = await aggregateSkuSlices([
    {
      $match: {
        konkName: input.konk,
        date: { $gte: warmStart, $lte: dateTo },
      },
    },
    { $sort: { date: 1 } },
    sliceDataProjectForProductIdList(allowedProductIds),
  ]);

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const sl of slices) {
    byDate.set(
      toSliceDate(sl.date).getTime(),
      (sl.data ?? {}) as Record<string, ISkuSliceDataItem>
    );
  }

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: input.konk }).select("title").lean(),
    Prod.findOne({ name: input.prod }).select("title").lean(),
  ]);

  const competitorTitle = (konkDoc?.title ?? "").trim();
  const producerName = (prodDoc?.title ?? "").trim();
  const rows: SkuSalesExcelSkuRow[] = rowsBase.map((row) => ({
    title: row.title,
    url: row.url,
    productId: row.productId,
    konkName: row.konkName,
    competitorTitle,
    producerName,
  }));

  const { buffer } = await buildSkuSalesExcelForSkus(
    rows,
    dateFrom,
    dateTo,
    (kn, pid, d) => {
      if (kn !== input.konk) return undefined;
      const rec = byDate.get(toSliceDate(d).getTime());
      return rec?.[pid];
    },
    {
      summaryMode: "bottomOnly",
      summarySalesLabel: "Загальні продажі, шт",
      summaryRevenueLabel: "Загальна виручка, грн",
    }
  );

  const fileName = `sku_sales_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;
  return { ok: true, buffer, fileName };
}
