import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import type { ISkuSliceDataItem } from "../../../models/SkuSlice.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
  type SkuSliceExcelSkuRow,
} from "../../../utils/buildSkuSliceExcel.js";
import type { GetKonkSkuSliceExcelInput } from "../schemas/getKonkSkuSliceExcelSchema.js";

export type GetKonkSkuSliceExcelResult =
  | { ok: true; buffer: Buffer; fileName: string }
  | { ok: false };

export async function getKonkSkuSliceExcelUtil(
  input: GetKonkSkuSliceExcelInput
): Promise<GetKonkSkuSliceExcelResult> {
  const skus = await Sku.find({
    konkName: input.konk,
    prodName: input.prod,
  })
    .sort({ productId: 1 })
    .lean();

  if (skus.length === 0) return { ok: false };

  const rows: SkuSliceExcelSkuRow[] = skus
    .map((s) => ({
      title: s.title,
      url: s.url,
      productId: (s.productId ?? "").trim(),
      konkName: s.konkName,
      prodName: s.prodName,
    }))
    .filter((r) => r.productId !== "");

  if (rows.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const slices = await SkuSlice.find({
    konkName: input.konk,
    date: { $gte: dateFrom, $lte: dateTo },
  })
    .select("date data")
    .lean();

  const byDate = new Map<number, Record<string, ISkuSliceDataItem>>();
  for (const sl of slices) {
    const t = toSliceDate(sl.date).getTime();
    byDate.set(t, (sl.data ?? {}) as Record<string, ISkuSliceDataItem>);
  }

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: input.konk }).select("title").lean(),
    Prod.findOne({ name: input.prod }).select("title").lean(),
  ]);
  const titles = {
    competitorTitle: (konkDoc?.title ?? "").trim(),
    producerName: (prodDoc?.title ?? "").trim(),
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
