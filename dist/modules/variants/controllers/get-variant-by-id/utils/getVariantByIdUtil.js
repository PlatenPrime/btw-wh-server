import { Variant } from "../../../models/Variant.js";
export const getVariantByIdUtil = async (id) => {
    return (await Variant.findById(id).lean());
};
