import { Variant } from "../../../models/Variant.js";
export const updateVariantByIdUtil = async (input) => {
    const update = {};
    const updatable = [
        "konkName",
        "prodName",
        "title",
        "url",
        "varGroup",
        "imageUrl",
    ];
    for (const key of updatable) {
        const val = input[key];
        if (val !== undefined)
            update[key] = val;
    }
    if (Object.keys(update).length === 0) {
        return Variant.findById(input.id);
    }
    const variant = await Variant.findByIdAndUpdate(input.id, update, { new: true, runValidators: true });
    return variant;
};
