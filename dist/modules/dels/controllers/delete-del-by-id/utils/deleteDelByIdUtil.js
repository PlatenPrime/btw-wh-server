import { Del } from "../../../models/Del.js";
export const deleteDelByIdUtil = async (id) => {
    const del = await Del.findByIdAndDelete(id);
    return del;
};
