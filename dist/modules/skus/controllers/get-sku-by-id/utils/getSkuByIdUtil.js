import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../models/Sku.js";
export const getSkuByIdUtil = async (id) => {
    const sku = await Sku.findById(id).lean().exec();
    if (!sku) {
        return null;
    }
    const skugrs = await Skugr.find({ skus: sku._id })
        .sort({ _id: 1 })
        .lean()
        .exec();
    return { ...sku, skugrs };
};
