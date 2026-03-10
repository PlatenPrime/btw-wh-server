import { Kask } from "../../../models/Kask.js";
export const deleteKaskUtil = async (id) => {
    return Kask.findByIdAndDelete(id);
};
