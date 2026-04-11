import type { Types } from "mongoose";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { aggregateDailySkuSliceMetricsForSkus } from "../../../utils/aggregateDailySkuSliceMetricsForSkus.js";
import { loadSkugrWithOrderedSkus } from "../../../utils/skugrReporting.js";
import type { GetKonkProdSkugrGroupsSalesInput } from "../schemas/getKonkProdSkugrGroupsSalesSchema.js";

export type SkugrGroupSalesRow = {
  skugrId: string;
  title: string;
  salesPcs: number;
  salesUah: number;
};

export type GetKonkProdSkugrGroupsSalesResult =
  | { ok: true; data: SkugrGroupSalesRow[] }
  | { ok: false };

type SkugrLean = {
  _id: Types.ObjectId;
  title: string;
};

export async function getKonkProdSkugrGroupsSalesUtil(
  input: GetKonkProdSkugrGroupsSalesInput,
): Promise<GetKonkProdSkugrGroupsSalesResult> {
  const skugrs = await Skugr.find({
    konkName: input.konk,
    prodName: input.prod,
  })
    .select("_id title")
    .lean<SkugrLean[]>();

  if (skugrs.length === 0) return { ok: false };

  skugrs.sort((a, b) => {
    const titleCmp = (a.title ?? "").localeCompare(b.title ?? "");
    if (titleCmp !== 0) return titleCmp;
    return a._id.toString().localeCompare(b._id.toString());
  });

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const data: SkugrGroupSalesRow[] = [];

  for (const row of skugrs) {
    const skugrId = row._id.toString();
    const title = (row.title ?? "").trim();

    const loaded = await loadSkugrWithOrderedSkus(skugrId);
    if (!loaded) {
      data.push({ skugrId, title, salesPcs: 0, salesUah: 0 });
      continue;
    }

    if (loaded.skus.length === 0) {
      data.push({ skugrId, title: loaded.skugr.title ?? title, salesPcs: 0, salesUah: 0 });
      continue;
    }

    const metrics = await aggregateDailySkuSliceMetricsForSkus(
      loaded.skus.map((s) => ({ konkName: s.konkName, productId: s.productId })),
      dateFrom,
      dateTo,
    );

    if (!metrics.ok) {
      data.push({
        skugrId,
        title: loaded.skugr.title ?? title,
        salesPcs: 0,
        salesUah: 0,
      });
      continue;
    }

    let salesPcs = 0;
    let salesUah = 0;
    for (const day of metrics.data) {
      salesPcs += day.sales;
      salesUah += day.revenue;
    }
    salesUah = Math.round(salesUah * 100) / 100;

    data.push({
      skugrId,
      title: loaded.skugr.title ?? title,
      salesPcs,
      salesUah,
    });
  }

  return { ok: true, data };
}
