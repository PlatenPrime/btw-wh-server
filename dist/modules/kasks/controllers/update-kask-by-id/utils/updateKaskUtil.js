import { Kask } from "../../../models/Kask.js";
export const updateKaskUtil = async (id, update) => {
    return Kask.findByIdAndUpdate(id, { $set: update }, { new: true });
};
