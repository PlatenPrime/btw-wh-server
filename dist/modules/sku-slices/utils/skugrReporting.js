import { Skugr } from "../../skugrs/models/Skugr.js";
import { Sku } from "../../skus/models/Sku.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
export function enumerateReportingDates(from, to) {
    const out = [];
    const cursor = new Date(from);
    while (cursor.getTime() <= to.getTime()) {
        out.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
}
export function buildSliceMapsByKonk(slices) {
    const maps = new Map();
    for (const sl of slices) {
        const kn = sl.konkName;
        let byDate = maps.get(kn);
        if (!byDate) {
            byDate = new Map();
            maps.set(kn, byDate);
        }
        const t = toSliceDate(sl.date).getTime();
        byDate.set(t, (sl.data ?? {}));
    }
    return maps;
}
export function getSliceItem(maps, konkName, productId, sliceDate) {
    const byDate = maps.get(konkName);
    if (!byDate)
        return undefined;
    const rec = byDate.get(toSliceDate(sliceDate).getTime());
    return rec?.[productId];
}
/**
 * Skugr + SKU в порядке skugr.skus; только SKU с непустым productId.
 */
export async function loadSkugrWithOrderedSkus(skugrId) {
    const skugr = await Skugr.findById(skugrId)
        .select("konkName prodName title skus")
        .lean();
    if (!skugr)
        return null;
    if (!skugr.skus?.length) {
        return { skugr, skus: [] };
    }
    const found = await Sku.find({ _id: { $in: skugr.skus } })
        .select("konkName prodName title url productId")
        .lean();
    const byId = new Map(found.map((s) => [s._id.toString(), s]));
    const skus = [];
    for (const id of skugr.skus) {
        const s = byId.get(id.toString());
        if (!s)
            continue;
        const pid = (s.productId ?? "").trim();
        if (!pid)
            continue;
        skus.push({ ...s, productId: pid });
    }
    return { skugr, skus };
}
export function uniqueKonkNamesFromSkus(skus) {
    return [...new Set(skus.map((s) => s.konkName))];
}
