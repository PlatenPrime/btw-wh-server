import { Sku } from "../../../models/Sku.js";
export const getSkuByIdUtil = async (id) => {
    const sku = await Sku.findById(id);
    return sku;
};
