import { Prod } from "../../../models/Prod.js";
export const deleteProdByIdUtil = async (id) => {
    const prod = await Prod.findByIdAndDelete(id);
    return prod;
};
