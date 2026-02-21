import { Prod } from "../../../models/Prod.js";
export const getProdByIdUtil = async (id) => {
    const prod = await Prod.findById(id);
    return prod;
};
