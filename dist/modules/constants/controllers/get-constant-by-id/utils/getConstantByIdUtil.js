import { Constant } from "../../../models/Constant.js";
export const getConstantByIdUtil = async (id) => {
    const constant = await Constant.findById(id);
    return constant;
};
