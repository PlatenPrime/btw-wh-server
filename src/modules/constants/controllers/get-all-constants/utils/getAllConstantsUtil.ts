import { Constant, IConstant } from "../../../models/Constant.js";

export const getAllConstantsUtil = async (): Promise<IConstant[]> => {
  const list = await Constant.find().sort({ createdAt: -1 }).lean();
  return list as IConstant[];
};
