import { Constant } from "../../../models/Constant.js";
export const getAllConstantsUtil = async () => {
    const list = await Constant.find().sort({ createdAt: -1 }).lean();
    return list;
};
