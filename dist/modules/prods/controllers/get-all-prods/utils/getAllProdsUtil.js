import { Prod } from "../../../models/Prod.js";
export const getAllProdsUtil = async () => {
    const list = await Prod.find().sort({ title: 1 }).lean();
    return list;
};
