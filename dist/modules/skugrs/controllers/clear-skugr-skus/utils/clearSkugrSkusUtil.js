import { Skugr } from "../../../models/Skugr.js";
export const clearSkugrSkusUtil = async (id) => {
    return Skugr.findByIdAndUpdate(id, { $set: { skus: [] } }, { new: true, runValidators: true });
};
