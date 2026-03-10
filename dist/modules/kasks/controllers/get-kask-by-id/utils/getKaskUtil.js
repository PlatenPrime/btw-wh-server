import { Kask } from "../../../models/Kask.js";
export const getKaskUtil = async (id) => {
    return Kask.findById(id);
};
