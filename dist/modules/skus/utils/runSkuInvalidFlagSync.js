import { toSliceDate } from "../../../utils/sliceDate.js";
import { SkuSlice } from "../../sku-slices/models/SkuSlice.js";
import { sliceDateMinusDays } from "../../sku-slices/utils/coalesceSkuSliceItemsForReporting.js";
import { enumerateReportingDates } from "../../sku-slices/utils/skugrReporting.js";
import { Sku } from "../models/Sku.js";
/**
 * Окно: 7 последовательных UTC-ключей среза, заканчиваясь вчерашним днём относительно `referenceDate`
 * (календарь Киева через toSliceDate). SKU помечается isInvalid, только если **в каждый** из этих дней
 * есть документ SkuSlice по конкуренту и в data[productId] — stock === -1 и price === -1.
 * Иначе isInvalid = false (в т.ч. при дыре в срезах).
 */
export async function runSkuInvalidFlagSync(referenceDate = new Date()) {
    const windowEnd = sliceDateMinusDays(toSliceDate(referenceDate), 1);
    const windowStart = sliceDateMinusDays(windowEnd, 6);
    const dates = enumerateReportingDates(windowStart, windowEnd);
    const konks = await Sku.distinct("konkName");
    const konkList = konks.filter((k) => typeof k === "string" && k.length > 0);
    let updated = 0;
    for (const konkName of konkList) {
        const slices = await SkuSlice.find({
            konkName,
            date: { $gte: windowStart, $lte: windowEnd },
        }).lean();
        const byDate = new Map();
        for (const sl of slices) {
            byDate.set(toSliceDate(sl.date).getTime(), (sl.data ?? {}));
        }
        const skus = await Sku.find({ konkName }).select("_id productId").lean();
        const bulkOps = [];
        for (const sku of skus) {
            const pid = (sku.productId ?? "").trim();
            let isInvalid = false;
            if (pid) {
                isInvalid = dates.every((d) => {
                    const rec = byDate.get(toSliceDate(d).getTime());
                    if (!rec)
                        return false;
                    const it = rec[pid];
                    return it != null && it.stock === -1 && it.price === -1;
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
