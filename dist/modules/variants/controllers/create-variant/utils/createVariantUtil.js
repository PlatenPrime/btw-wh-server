import { Variant } from "../../../models/Variant.js";
export const createVariantUtil = async (input) => {
    return Variant.create(input);
};
