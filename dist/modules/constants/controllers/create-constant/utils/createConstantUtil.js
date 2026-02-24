import { Constant } from "../../../models/Constant.js";
export const createConstantUtil = async (input) => {
    const constant = await Constant.create({
        name: input.name,
        title: input.title,
        data: input.data ?? {},
    });
    return constant;
};
