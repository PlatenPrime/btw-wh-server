import { Del } from "../../../models/Del.js";
export const getDelByIdUtil = async (id) => {
    const del = await Del.findById(id);
    return del;
};
