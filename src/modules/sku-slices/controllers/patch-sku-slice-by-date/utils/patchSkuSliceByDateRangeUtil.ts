import { Sku } from "../../../../skus/models/Sku.js";
import {
  SkuSlice,
  type ISkuSliceDataItem,
} from "../../../models/SkuSlice.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import type { PatchSkuSliceByDateRangeInput } from "../schemas/patchSkuSliceByDateSchema.js";
import { readPreviousPoint } from "./patchSkuSliceByDateUtil.js";
import {
  materializeSkuSliceSalesDateRange,
  sliceDatePlusDays,
} from "../../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";

export type PatchSkuSliceByDateRangeDayResult = {
  date: Date;
  previous: ISkuSliceDataItem | null;
  created: boolean;
};

export type PatchSkuSliceByDateRangeResult = {
  productId: string;
  stock: number;
  price: number;
  dateFrom: Date;
  dateTo: Date;
  updatedCount: number;
  days: PatchSkuSliceByDateRangeDayResult[];
};

/**
 * Пишет одинаковые stock/price SKU на каждый день диапазона (включительно).
 * Отсутствующие дневные документы создаются (upsert).
 */
export async function patchSkuSliceByDateRangeUtil(
  input: PatchSkuSliceByDateRangeInput
): Promise<PatchSkuSliceByDateRangeResult | null> {
  const sku = await Sku.findById(input.skuId)
    .select("konkName productId")
    .lean();
  if (!sku) return null;

  const productId = sku.productId?.trim();
  if (!productId) return null;

  const dateFrom = toSliceDate(input.dateFrom);
  const dateTo = toSliceDate(input.dateTo);
  const dates = enumerateSliceDates(dateFrom, dateTo);
  const nextItem: ISkuSliceDataItem = {
    stock: input.stock,
    price: input.price,
  };

  const days: PatchSkuSliceByDateRangeDayResult[] = [];

  for (const sliceDate of dates) {
    const before = await SkuSlice.findOneAndUpdate(
      { konkName: sku.konkName, date: sliceDate },
      {
        $set: { [`data.${productId}`]: nextItem },
        $setOnInsert: { konkName: sku.konkName, date: sliceDate },
      },
      { upsert: true, new: false }
    ).lean();

    const created = before == null;
    const previous = created
      ? null
      : readPreviousPoint(
          (before.data as Record<string, unknown> | undefined)?.[productId]
        );

    days.push({ date: sliceDate, previous, created });
  }

  await materializeSkuSliceSalesDateRange({
    konkName: sku.konkName,
    fromDate: dateFrom,
    toDate: sliceDatePlusDays(dateTo, 1),
    productIds: [productId],
    apply: true,
  });

  return {
    productId,
    stock: nextItem.stock,
    price: nextItem.price,
    dateFrom,
    dateTo,
    updatedCount: days.length,
    days,
  };
}
