import { Variant } from "../../../models/Variant.js";
export const deleteVariantByIdUtil = async (id) => {
    return Variant.findByIdAndDelete(id);
};
