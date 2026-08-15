import { GraboSku } from "../../../models/GraboSku.js";
export const getGraboSkuByIdUtil = async (id) => {
    return GraboSku.findById(id).select("-__v").lean().exec();
};
