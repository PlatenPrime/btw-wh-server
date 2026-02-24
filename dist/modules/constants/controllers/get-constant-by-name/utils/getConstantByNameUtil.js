import { Constant } from "../../../models/Constant.js";
export const getConstantByNameUtil = async (name) => {
    const constant = await Constant.findOne({ name });
    return constant;
};
