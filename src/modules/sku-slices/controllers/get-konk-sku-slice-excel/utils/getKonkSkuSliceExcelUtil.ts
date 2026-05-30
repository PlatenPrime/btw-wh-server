import { Konk } from "../../../../konks/models/Konk.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../../utils/coalesceSkuSliceItemsForReporting.js";
import {
  aggregateSkuSlices,
  sliceDataProjectForProductIdList,
} from "../../../utils/sliceDataAggregationStages.js";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
  type SkuSliceExcelSkuRow,
} from "../../../utils/buildSkuSliceExcel.js";
import { loadProdDisplayTitlesByName } from "../../../utils/prodDisplayTitles.js";
import { resolveKonkProdSkus } from "../../../utils/resolveKonkProdSkus.js";
import type { GetKonkSkuSliceExcelInput } from "../schemas/getKonkSkuSliceExcelSchema.js";

export type GetKonkSkuSliceExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getKonkSkuSliceExcelUtil(
  input: GetKonkSkuSliceExcelInput
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
  const warmStart = sliceDateMinusDays(dateFrom, 1);

  const allowedProductIds = rows.map((r) => r.productId);
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
    const t = toSliceDate(sl.date).getTime();
    byDate.set(t, (sl.data ?? {}) as Record<string, ISkuSliceDataItem>);
  }

  const [konkDoc] = await Promise.all([
    Konk.findOne({ name: input.konk }).select("title").lean(),
  ]);
  const titles = {
    competitorTitle: (konkDoc?.title ?? "").trim(),
    producerName: "",
  };

  const { buffer } = await buildSkuSliceExcelForSkus(
    rows,
    dateFrom,
    dateTo,
    (kn, pid, d) => {
      if (kn !== input.konk) return undefined;
      const rec = byDate.get(toSliceDate(d).getTime());
      return rec?.[pid];
    },
    titles,
    {
      includeTotalsRow: true,
      totalsRowLabel: "Підсумок",
    }
  );

  const fileName = `sku_slice_konk_${safeFilePart(input.konk)}_${safeFilePart(input.prod)}_${formatDateHeader(dateFrom)}_${formatDateHeader(dateTo)}.xlsx`;

  return { ok: true, buffer, fileName };
}
