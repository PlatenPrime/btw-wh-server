import { toSliceDate } from "../../../../../utils/sliceDate.js";
import { aggregatePeriodSkuSliceMetricsForSkus } from "../../../../sku-reporting/utils/aggregatePeriodSkuSliceMetricsForSkus.js";
import { computeSharePercent } from "../../../../sku-reporting/utils/computeSharePercent.js";
import { resolveSelectionSkus } from "../../../../sku-reporting/utils/resolveSelectionSkus.js";
import type { GetSelectionSkusPieDataInput } from "../schemas/getSelectionSkusPieDataSchema.js";

const ALL_SELECTED_TITLE = "Всі обрані";

export type SelectionSkuPieItem = {
  title: string;
  konkName: string;
  productId: string;
  salesPcs: number;
  salesUah: number;
  sharePcs: number;
  shareUah: number;
};

export type SelectionSkuPieAll = {
  title: string;
  salesPcs: number;
  salesUah: number;
};

export type GetSelectionSkusPieDataResult =
  | {
      ok: true;
      data: Record<string, SelectionSkuPieItem>;
      all: SelectionSkuPieAll;
    }
  | { ok: false };

export async function getSelectionSkusPieDataUtil(
  input: GetSelectionSkusPieDataInput,
): Promise<GetSelectionSkusPieDataResult> {
  const resolved = await resolveSelectionSkus(
    input.selectAll === true
      ? {
          selectAll: true,
          search: input.search,
          konkName: input.konkName,
          prodName: input.prodName,
        }
      : { skuIds: input.skuIds! },
  );
  if (resolved.length === 0) return { ok: false };

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);

  const metrics = await aggregatePeriodSkuSliceMetricsForSkus(
    resolved.map((r) => ({ konkName: r.konkName, productId: r.productId })),
    dateFrom,
    dateTo,
  );
  if (!metrics.ok) return { ok: false };

  let totalPcs = 0;
  let totalUah = 0;
  for (const m of metrics.data) {
    totalPcs += m.salesPcs;
    totalUah += m.salesUah;
  }
  totalUah = Math.round(totalUah * 100) / 100;

  const data: Record<string, SelectionSkuPieItem> = {};
  for (let i = 0; i < resolved.length; i++) {
    const sku = resolved[i]!;
    const m = metrics.data[i]!;
    const skuId = sku._id.toString();
    data[skuId] = {
      title: sku.title,
      konkName: sku.konkName,
      productId: sku.productId,
      salesPcs: m.salesPcs,
      salesUah: m.salesUah,
      sharePcs: computeSharePercent(m.salesPcs, totalPcs),
      shareUah: computeSharePercent(m.salesUah, totalUah),
    };
  }

  return {
    ok: true,
    data,
    all: {
      title: ALL_SELECTED_TITLE,
      salesPcs: totalPcs,
      salesUah: totalUah,
    },
  };
}
