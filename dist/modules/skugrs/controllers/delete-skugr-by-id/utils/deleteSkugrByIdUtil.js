import { Skugr } from "../../../models/Skugr.js";
export const deleteSkugrByIdUtil = async (id) => {
    const skugr = await Skugr.findByIdAndDelete(id);
    return skugr;
};
