import { Sku } from "../../../../skus/models/Sku.js";
import {
  SkuSlice,
  type ISkuSliceDataItem,
} from "../../../models/SkuSlice.js";
import { enumerateSliceDates } from "../../../../slices/utils/enumerateSliceDates.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
import type { PatchSkuSliceByDatePeriodsInput } from "../schemas/patchSkuSliceByDateSchema.js";
import { readPreviousPoint } from "./patchSkuSliceByDateUtil.js";
import type { PatchSkuSliceByDateRangeDayResult } from "./patchSkuSliceByDateRangeUtil.js";
import {
  materializeSkuSliceSalesDateRange,
  sliceDatePlusDays,
} from "../../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js";

export type PatchSkuSliceByDatePeriodsResult = {
  productId: string;
  stock: number;
  price: number;
  periods: Array<{ dateFrom: Date; dateTo: Date }>;
  updatedCount: number;
  days: PatchSkuSliceByDateRangeDayResult[];
};

/**
 * Пишет одинаковые stock/price SKU на каждый уникальный день из массива периодов.
 * Пересечения периодов дедуплицируются. Отсутствующие дневные документы создаются (upsert).
 */
export async function patchSkuSliceByDatePeriodsUtil(
  input: PatchSkuSliceByDatePeriodsInput
): Promise<PatchSkuSliceByDatePeriodsResult | null> {
  const sku = await Sku.findById(input.skuId)
    .select("konkName productId")
    .lean();
  if (!sku) return null;

  const productId = sku.productId?.trim();
  if (!productId) return null;

  const periods = input.periods.map((p) => ({
    dateFrom: toSliceDate(p.dateFrom),
    dateTo: toSliceDate(p.dateTo),
  }));

  const uniqueByTime = new Map<number, Date>();
  for (const period of periods) {
    for (const day of enumerateSliceDates(period.dateFrom, period.dateTo)) {
      uniqueByTime.set(day.getTime(), day);
    }
  }
  const dates = [...uniqueByTime.values()].sort(
    (a, b) => a.getTime() - b.getTime()
  );

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

  if (dates.length > 0) {
    const first = dates[0]!;
    const last = dates[dates.length - 1]!;
    await materializeSkuSliceSalesDateRange({
      konkName: sku.konkName,
      fromDate: first,
      toDate: sliceDatePlusDays(last, 1),
      productIds: [productId],
      apply: true,
    });
  }

  return {
    productId,
    stock: nextItem.stock,
    price: nextItem.price,
    periods,
    updatedCount: days.length,
    days,
  };
}
