import { toSliceDate } from "../../../../../utils/sliceDate.js";
import {
  aggregatePeriodSkuSliceMetricsBySkuKey,
  skuSliceMetricsKey,
} from "../../../../sku-reporting/utils/aggregatePeriodSkuSliceMetricsForSkus.js";
import { loadSkugrsWithSkuRefsForKonkProd } from "../../../../sku-reporting/utils/skugrReporting.js";
import type { GetKonkProdSkugrGroupsSalesInput } from "../schemas/getKonkProdSkugrGroupsSalesSchema.js";

export type SkugrGroupSalesRow = {
  skugrId: string;
  title: string;
  salesPcs: number;
  salesUah: number;
};

type SkugrGroupsTotal = {
  title: string;
  salesPcs: number;
  salesUah: number;
};

const ALL_SKUGR_GROUPS_TITLE = "Всі групи";

export type GetKonkProdSkugrGroupsSalesResult =
  | { ok: true; data: SkugrGroupSalesRow[]; all: SkugrGroupsTotal }
  | { ok: false };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Итоги продаж по Skugr konk/prod за период.
 * Batch: один load групп+SKU, один period-aggregate по unique productId.
 * `all` — сумма строк `data` (summary отчёта).
 */
export async function getKonkProdSkugrGroupsSalesUtil(
  input: GetKonkProdSkugrGroupsSalesInput,
): Promise<GetKonkProdSkugrGroupsSalesResult> {
  const groups = await loadSkugrsWithSkuRefsForKonkProd(input.konk, input.prod);
  if (groups.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const allSkuRefs = groups.flatMap((g) => g.skus);
  const metricsByKey =
    allSkuRefs.length === 0
      ? null
      : await aggregatePeriodSkuSliceMetricsBySkuKey(
          allSkuRefs,
          dateFrom,
          dateTo,
        );

  const data: SkugrGroupSalesRow[] = groups.map((g) => {
    let salesPcs = 0;
    let salesUah = 0;
    if (metricsByKey?.ok) {
      for (const sku of g.skus) {
        const m = metricsByKey.byKey.get(
          skuSliceMetricsKey(sku.konkName, sku.productId),
        );
        if (!m) continue;
        salesPcs += m.salesPcs;
        salesUah += m.salesUah;
      }
    }
    return {
      skugrId: g.skugrId,
      title: g.title,
      salesPcs,
      salesUah: round2(salesUah),
    };
  });

  let totalSalesPcs = 0;
  let totalSalesUah = 0;
  for (const row of data) {
    totalSalesPcs += row.salesPcs;
    totalSalesUah += row.salesUah;
  }

  const all: SkugrGroupsTotal = {
    title: ALL_SKUGR_GROUPS_TITLE,
    salesPcs: totalSalesPcs,
    salesUah: round2(totalSalesUah),
  };

  return { ok: true, data, all };
}
