import { Sku } from "../../../models/Sku.js";
export const deleteSkuByIdUtil = async (id) => {
    const sku = await Sku.findByIdAndDelete(id);
    return sku;
};
