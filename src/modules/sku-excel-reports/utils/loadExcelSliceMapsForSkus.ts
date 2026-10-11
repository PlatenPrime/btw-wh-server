import { toSliceDate } from "../../../utils/sliceDate.js";
import { loadSkuSliceRowsForKonksProducts } from "../../sku-slices/utils/sliceDataAggregationStages.js";
import {
  buildSliceMapsByKonk,
  type SliceMapsByKonk,
} from "../../sku-reporting/utils/skugrReporting.js";

export type ExcelSliceSkuRef = {
  konkName: string;
  productId: string;
};

/**
 * Узкий load months → SliceMapsByKonk только по переданным productId
 * (не full-konk day maps через deprecated aggregateSkuSlices).
 */
export async function loadExcelSliceMapsForSkus(
  skus: ExcelSliceSkuRef[],
  dateFrom: Date,
  dateTo: Date,
): Promise<SliceMapsByKonk> {
  const from = toSliceDate(dateFrom);
  const to = toSliceDate(dateTo);
  if (skus.length === 0 || from.getTime() > to.getTime()) {
    return new Map();
  }

  const refs = skus
    .map((s) => ({
      konkName: s.konkName,
      productId: (s.productId ?? "").trim(),
    }))
    .filter((s) => s.productId !== "");

  if (refs.length === 0) return new Map();

  const rows = await loadSkuSliceRowsForKonksProducts(refs, from, to);
  return buildSliceMapsByKonk(rows);
}
