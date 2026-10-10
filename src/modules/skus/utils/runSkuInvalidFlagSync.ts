import { isFullMinusOneStockPrice } from "../../slices/utils/isInvalidSliceStockResult.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { sliceDateMinusDays } from "../../sku-reporting/utils/coalesceSkuSliceItemsForReporting.js";
import { enumerateReportingDates } from "../../sku-reporting/utils/skugrReporting.js";
import { loadDayMapsForKonkDates } from "../../sku-slices/utils/skuSliceMonthStore.js";
import { Sku } from "../models/Sku.js";

export type RunSkuInvalidFlagSyncResult = {
  /** Сколько SKU обработано (updateOne в bulkWrite). */
  updated: number;
  /** Сколько уникальных konkName было в выборке. */
  konkCount: number;
};

/**
 * Окно: 7 последовательных UTC-ключей среза, заканчиваясь вчерашним днём относительно `referenceDate`.
 * SKU помечается isInvalid, только если **в каждый** из этих дней в SkuSliceMonth
 * есть точка productId со stock === -1 и price === -1. Иначе isInvalid = false.
 */
export async function runSkuInvalidFlagSync(
  referenceDate: Date = new Date(),
): Promise<RunSkuInvalidFlagSyncResult> {
  const windowEnd = sliceDateMinusDays(toSliceDate(referenceDate), 1);
  const windowStart = sliceDateMinusDays(windowEnd, 6);
  const dates = enumerateReportingDates(windowStart, windowEnd);

  const konks = await Sku.distinct("konkName");
  const konkList = konks.filter(
    (k): k is string => typeof k === "string" && k.length > 0,
  );

  let updated = 0;

  for (const konkName of konkList) {
    const maps = await loadDayMapsForKonkDates(konkName, dates);
    const byDate = new Map<number, Record<string, { stock: number; price: number }>>();
    for (const d of dates) {
      byDate.set(toSliceDate(d).getTime(), maps.get(d.getTime()) ?? {});
    }

    const skus = await Sku.find({ konkName }).select("_id productId").lean();
    const bulkOps: Array<{
      updateOne: {
        filter: { _id: unknown };
        update: { $set: { isInvalid: boolean } };
      };
    }> = [];

    for (const sku of skus) {
      const pid = (sku.productId ?? "").trim();
      let isInvalid = false;

      if (pid) {
        isInvalid = dates.every((d) => {
          const rec = byDate.get(toSliceDate(d).getTime());
          if (!rec || Object.keys(rec).length === 0) return false;
          const it = rec[pid];
          return (
            it != null && isFullMinusOneStockPrice(it.stock, it.price)
          );
        });
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: sku._id },
          update: { $set: { isInvalid } },
        },
      });
    }

    if (bulkOps.length > 0) {
      await Sku.bulkWrite(bulkOps);
      updated += bulkOps.length;
    }
  }

  return { updated, konkCount: konkList.length };
}
