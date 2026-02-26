import { Analog } from "../../../models/Analog.js";
export const getAnalogsByProdUtil = async (prodName) => {
    const analogs = await Analog.find({ prodName }).sort({ createdAt: -1 }).lean();
    return analogs;
};
