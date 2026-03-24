import { Sku } from "../../../models/Sku.js";
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const fixIncorrectSkuDataUtil = async (input) => {
    const { filter: filterInput, updates } = input;
    const conditions = [];
    if (filterInput.konkName !== undefined && filterInput.konkName.trim() !== "") {
        conditions.push({ konkName: filterInput.konkName });
    }
    if (filterInput.prodName !== undefined && filterInput.prodName.trim() !== "") {
        conditions.push({ prodName: filterInput.prodName });
    }
    if (filterInput.search !== undefined && filterInput.search.trim() !== "") {
        conditions.push({
            title: {
                $regex: escapeRegex(filterInput.search.trim()),
                $options: "i",
            },
        });
    }
    if (filterInput.productId !== undefined) {
        conditions.push({ productId: filterInput.productId });
    }
    if (filterInput.productIds !== undefined &&
        filterInput.productIds.length > 0) {
        conditions.push({ productId: { $in: filterInput.productIds } });
    }
    if (filterInput.btradeAnalog !== undefined) {
        conditions.push({ btradeAnalog: filterInput.btradeAnalog });
    }
    const mongoFilter = conditions.length === 1 ? conditions[0] : { $and: conditions };
    const $set = {};
    if (updates.konkName !== undefined)
        $set.konkName = updates.konkName;
    if (updates.prodName !== undefined)
        $set.prodName = updates.prodName;
    if (updates.productId !== undefined)
        $set.productId = updates.productId;
    if (updates.btradeAnalog !== undefined)
        $set.btradeAnalog = updates.btradeAnalog;
    if (updates.title !== undefined)
        $set.title = updates.title;
    if (updates.url !== undefined)
        $set.url = updates.url;
    if (updates.imageUrl !== undefined)
        $set.imageUrl = updates.imageUrl;
    const result = await Sku.updateMany(mongoFilter, { $set }, { runValidators: true });
    return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    };
};
