import { Ask } from "../../../models/Ask.js";
export const getAskUtil = async (id) => {
    const ask = await Ask.findById(id);
    return ask;
};
