import { Prod } from "../../../models/Prod.js";
export const getProdByNameUtil = async (name) => {
    const prod = await Prod.findOne({ name });
    return prod;
};
