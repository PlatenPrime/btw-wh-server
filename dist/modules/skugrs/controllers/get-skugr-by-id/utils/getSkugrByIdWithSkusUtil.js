import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
import { toSkugrWithSkusDto } from "../../../utils/toSkugrWithSkusDto.js";
export const getSkugrByIdWithSkusUtil = async (id) => {
    const skugr = await Skugr.findById(id).exec();
    if (!skugr) {
        return null;
    }
    if (skugr.skus.length === 0) {
        return toSkugrWithSkusDto(skugr, []);
    }
    const skus = await Sku.find({ _id: { $in: skugr.skus } }).exec();
    const byId = new Map(skus.map((s) => [s._id.toString(), s]));
    const orderedSkus = skugr.skus
        .map((oid) => byId.get(oid.toString()))
        .filter((doc) => doc !== undefined);
    return toSkugrWithSkusDto(skugr, orderedSkus);
};
