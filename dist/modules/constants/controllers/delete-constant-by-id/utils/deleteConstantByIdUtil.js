import { Constant } from "../../../models/Constant.js";
export const deleteConstantByIdUtil = async (id) => {
    const constant = await Constant.findByIdAndDelete(id);
    return constant;
};
