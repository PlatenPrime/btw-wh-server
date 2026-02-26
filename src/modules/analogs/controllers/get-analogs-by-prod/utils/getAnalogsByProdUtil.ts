import { Analog } from "../../../models/Analog.js";

export const getAnalogsByProdUtil = async (prodName: string) => {
  const analogs = await Analog.find({ prodName }).sort({ createdAt: -1 }).lean();
  return analogs;
};
