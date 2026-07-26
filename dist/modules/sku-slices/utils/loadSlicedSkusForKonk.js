import { Sku } from "../../skus/models/Sku.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
/**
 * SKU конкурента, входящие хотя бы в одну группу с isSliced: true.
 */
export async function loadSlicedSkusForKonk(konkName, select = "_id productId") {
    const skugrs = (await Skugr.find({ konkName, isSliced: true })
        .select("skus")
        .lean());
    const slicedSkuIds = Array.from(new Set(skugrs.flatMap((group) => (group.skus ?? []).map((skuId) => skuId.toString()))));
    if (slicedSkuIds.length === 0)
        return [];
    return (await Sku.find({ konkName, _id: { $in: slicedSkuIds } })
        .select(select)
        .lean());
}
